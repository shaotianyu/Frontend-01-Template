const encoding = str => {
  return str
    .split('')
    .map((s) => `\\u${s.charCodeAt().toString(16)}`)
    .join('')
}