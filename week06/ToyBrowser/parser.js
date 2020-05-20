const EOF = Symbol('EOF')

var currentToken = null;
var currentAttribute = null;
var commentToken = null;
var currentTextNode = null
var stack = [{ type: "document", children: [] }]

function emit(token) {
    var top = stack[stack.length - 1]

    if (token.type == "startTag") {
        var el = {
            type: 'element',
            children: [],
            attributes: []
        }
        el.tagName = token.tagName

        for (var p in token) {
            if (p != "type" && p != "tagName") {
                el.attributes.push({
                    name: p,
                    value: token[p]
                })
            }
        }

        top.children.push(el)
        el.parent = top

        if (!token.isSelfClosing) {
            stack.push(el)
        }
        currentTextNode = null
    } else if (token.type == 'endTag') {
        if (top.tagName != token.tagName) {
            throw new Error("tag start end does't match")
        } else {
            stack.pop()
        }
        currentTextNode = null
    }
}


// 入口状态机
function data(c) {
    if (c == '<') {
        return tagOpen
    } else if (c == EOF) {
        return emit({
            type: "EOF"
        })
    } else {
        emit({
            type: "text",
            content: c
        })
        return data
    }
}

//  <span/> /<span></span>
function tagOpen(c) {
    if (c == '!') {
        return markupDeclaration
    } else if (c == '/') {
        return endTagOpen
    } else if (c.match(/^[a-xA-Z]$/)) {
        currentToken = {
            type: "startTag",
            tagName: ""
        }
        return tagName(c)
    } else if (c == "?") {
        commentToken = {
            type: 'questionMark',
            data: ''
        }
        return BogusComment(c)
    } else if (c == "EOF") {
        emit({
            type: "EOF"
        })
    } else {
        emit({
            type: "text", // or type: < 
            content: c
        })
        return;
    }
}


// 结束标签 
function endTagOpen(c) {
    if (c.match(/^[a-xA-Z]$/)) {
        currentToken = {
            type: "endTag",
            tagName: ""
        }
        return tagName(c)
    } else if (c == ">") {
        // return data(c)
    } else if (c == "EOF") {
        return emit({
            type: "EOF" // type < or /
        })
    } else {
        commentToken = {
            type: 'questionMark',
            data: ''
        }
        return BogusComment(c)
    }
}
// 标签名称
function tagName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAtributeName;
    } else if (c == "/") {
        return selfClosingStartTag;
    } else if (c == ">") {
        emit(currentToken)
        return data
    } else if (c.match(/^[a-xA-Z]$/)) {
        currentToken.tagName += c;
        return tagName
    } else if (c == "EOF") {
        emit({
            type: "EOF"
        })
        return data
    } else {
        currentToken.tagName += c;
        return tagName
    }
}

function beforeAtributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAtributeName
    } else if (c == "=") {

    } else if (c == ">" || c == "/" || c == EOF) {
        return afterAttributeName(c)
    } else {
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c)
    }
}

function selfClosingStartTag(c) {
    if (c == ">") {
        currentToken.isSelfClosing = true
        return data
    } else if (c == "EOF") {

    } else {

    }
}


// 标签 attribute
function attributeName(c) {
    if (c.match(/^[\t\n\f ]$/) || c == "/" || c == EOF || c == ">") {
        return afterAttributeName(c)
    } else if (c == "=") {
        return beforeAtributeValue
    } else if (c == '\u0000') {
        currentAttribute.name += '\ufffd'
    } else if (c == "\"" || c == "'" || c == "<") {
        //  Treat it as per the "anything else" entry below.
        currentAttribute.name += c
        return attributeName
    } else {
        currentAttribute.name += c
        return attributeName
    }
}

// after 标签属性 
function afterAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return afterAttributeName
    } else if (c == "/") {
        return selfClosingStartTag;
    } else if (c == "=") {
        return beforeAtributeValue
    } else if (c == ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken)
        return data
    } else if (c == EOF) {
        emit({
            type: "EOF"
        })
    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c)
    }
}

function beforeAtributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
        return beforeAtributeValue
    } else if (c == "\"") {
        return doubleQuotedAttributeValue;
    } else if (c == "\'") {
        return singleQuotedAttributeValue
    } else if (c == ">") {
        emit(currentToken)
        return data
    } else {
        return UnquotedAttibutedValue(c)
    }
}

function doubleQuotedAttributeValue(c) {
    if (c == "\"") {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    } else if (c == "&") {

    } else if (c == "\u0000") {

    } else if (c == EOF) {
        emit({
            type: EOF
        })
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue
    }
}

function singleQuotedAttributeValue(c) {
    if (c == "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    } else if (c == "&") {
    } else if (c == "\u0000") {
    } else if (c == EOF) {
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAtributeName
    } else if (c == "/") {
        return selfClosingStartTag
    } else if (c == ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken)
        return data
    } else if (c == EOF) {
        emit({
            type: EOF
        })
    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue
    }
}

// mark 状态
function markupDeclaration(c) {
  return null
}

function UnquotedAttibutedValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAtributeName
    } else if (c == "/") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag
    } else if (c == ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken)
        return data
    } else if (c == "\u0000") {

    } else if (c == "\'" || c == "\"" || c == "<" || c == "=" || c == "`") {

    } else if (c == EOF) {

    } else {
        currentAttribute.value += c;
        return UnquotedAttibutedValue
    }
}

module.exports.handleParserHTML = function handleParserHTML(html) {
    var state = data;
    for (var item of html) {
        state = state(item)
    }
    state = state(EOF)
}