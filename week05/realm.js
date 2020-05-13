const set = new Set()
let current

const propertyList = [
  'eval',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'Array',
  'Date',
  'RegExp',
  'Promise',
  'Proxy',
  'Map',
  'WeakMap',
  'Set',
  'WeakSet',
  'Function',
  'Boolean',
  'String',
  'Number',
  'Symbol',
  'Object',
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView',
  'Float32Array',
  'Float64Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Uint8Array',
  'Uint16Array',
  'Uint32Array',
  'Uint8ClampedArray',
  'Atomics',
  'JSON',
  'Math',
  'Reflect',
]

while (propertyList.length) {

  current = propertyList.shift()

  if (set.has(current.object)) {
    continue
  }

  set.add(current.object)

  for(let p of Object.getOwnPropertyNames(current.object)) {
    var property = Object.getOwnPropertyDescriptor(current.object, p)


    if (
        property,hasOwnProperty('value')
        && ((property.value != null)
        && (property.value == 'object')
        || (typeof property.value == 'object') )
        && property.value instanceof Object
    ) {
      propertyList.push({
        path: current.path.concat([p]),
        object: property.value,
      })
    }
    if (property.hasOwnProperty('get')) {
      propertyList.push({
        path: current.path.concat([p]),
        object: property.get
      })
    }
    if (property.hasOwnProperty('set')) {
      propertyList.push({
        path: current.path.concat([p]),
        object: property.set
      })
    }
  }
}