! function (name, context, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
    else context[name] = definition()
}("Ajax", window, function () {
    // Iterator
    function forEach(obj, iterator, context) {
        if (obj.length === +obj.length) {
            for (var i = 0; i < obj.length; i++) {
                if (iterator.call(context, obj[i], i, obj) === true) return
            }
        } else {
            for (var k in obj) {
                if (iterator.call(context, obj[k], k, obj) === true) return
            }
        }
    }
    //adjust the type of the given argument
    var _type = {}, toString =  Object.prototype.toString
    forEach(['Array', 'Boolean', 'Function', 'Object', 'String', 'Number'], function (name) {
        _type['is' + name] = function (obj) {
            return toString.call(obj) === '[object ' + name + ']'
        }
    })
    // parse json string

    function JSONParse(str) {
        try {
            return JSON.parse(str)
        } catch (e) {
            try {
                return (new Function('return ' + str))()
            } catch (e) {}
        }
    }

    // create xhr object
    var createXHR = window.XMLHttpRequest ? function () {
            try {
                return new XMLHttpRequest()
            } catch (e) {}
        } : function () {
            try {
                return new window.ActiveXObject('Microsoft.XMLHTTP')
            } catch (e) {}
        }

    // object to queryString

    function serialize(obj) {
        var a = []
        forEach(obj, function (val, key) {
            if (_type.isArray(val)) {
                forEach(val, function (v, i) {
                    a.push(key + '=' + encodeURIComponent(v))
                })
            } else {
                a.push(key + '=' + encodeURIComponent(val))
            }
        })
        return a.join('&')
    }

    // empty function

    function noop() {}

    //create uuid for jsonp

    function generateRandomName() {
        var uuid = '',
            s = [],
            i = 0,
            hexDigits = '0123456789ABCDEF';
        for (i = 0; i < 32; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[12] = '4';
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
        uuid = 'jsonp_' + s.join('');
        return uuid;
    }

    function jsonp(url, options) {
        var ie678 = !-[1, ],
            opera = window.opera,
            doc = window.document,
            head = doc.head || doc.getElementsByTagName('head')[0],
            timeout = 3000,
            done = false,
            script = doc.createElement('script')

            var failure = options.failure,
            success = options.success,
            callbackName = options.callbackName,
            charset = options.charset,
            scope = options.scope

            function callback(isSucc) {
                if (isSucc) {
                    done = true
                } else {
                    failure.call(scope)
                }
                // Handle memory leak in IE
                script.onload = script.onerror = script.onreadystatechange = null
                if (head && script.parentNode) {
                    head.removeChild(script)
                    script = null
                    window[callbackName] = undefined
                }
            }

            function fixOnerror() {
                setTimeout(function () {
                    if (!done) {
                        callback()
                    }
                }, timeout)
            }
        if (ie678) {
            script.onreadystatechange = function () {
                var readyState = this.readyState
                if (!done && (readyState == 'loaded' || readyState == 'complete')) {
                    callback(true)
                }
            };

        } else {
            script.onload = function () {
                callback(true)
            }
            script.onerror = function () {
                callback()
            }
            if (opera) {
                fixOnerror()
            }
        }
        if (charset) {
            script.charset = charset
        }

        script.src = url
        head.insertBefore(script, head.firstChild)
    }
    function request(url, options) {
        if (_type.isObject(url)) {
            options = url
            url = options.url
        }
        var xhr, isTimeout, timer, options = options || {}
        var async = options.async !== false,
            method = options.method || 'GET',
            type = options.type || 'json',
            encode = options.encode || 'UTF-8',
            timeout = options.timeout || 0,
            credential = options.credential,
            data = options.data||{},
            scope = options.scope,
            success = options.success || noop,
            failure = options.failure || noop,
            method = method.toUpperCase(),

            //special for jsonp
            charset = options.charset,
            timestamp = options.timestamp,
            jsonpName = options.jsonpName || 'callback',
            callbackName = options.jsonpCallback || generateRandomName()
      
            

            return options.type == "jsonp" ? (function () {
                timestamp = timestamp||true;
                var query = (url || '').indexOf('?') === -1 ? '?' : '&'

                query += jsonpName + "=" + callbackName;

                if (data && _type.isObject(data)) {
                    query += "&"+serialize(data);
                }

                if (timestamp) {
                    query += '&ts='
                    query += (new Date).getTime()
                }
                window[callbackName] = function (result) {
                    success.call(scope, result);
                };
                var _options = {
                    success: success,
                    charset: charset,
                    failure: failure,
                    scope: scope,
                    callbackName: callbackName
                }
                jsonp(url + query, _options);
                return callbackName;
            })() : (function () {
                // 对象转换成字符串键值对
                if (data && _type.isObject(data)) {
                    data = serialize(data)
                }
                if (method === 'GET' && data) {
                    url += (url.indexOf('?') === -1 ? '?' : '&') + data
                }
                xhr = createXHR()
                if (!xhr) {
                    return
                }

                isTimeout = false
                if (async && timeout > 0) {
                    timer = setTimeout(function () {
                        // 先给isTimeout赋值，不能先调用abort
                        isTimeout = true
                        xhr.abort()
                    }, timeout)
                }
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (isTimeout) {
                            failure(xhr, 'request timeout')
                        } else {
                            onStateChange(xhr, type, success, failure, scope)
                            clearTimeout(timer)
                        }
                    }
                }
                xhr.open(method, url, async)
                if (credential) {
                    xhr.withCredentials = true
                }
                if (method == 'POST') {
                    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=' + encode)
                }
                xhr.send(data)
                return xhr
            })()

    }

    function onStateChange(xhr, type, success, failure, scope) {
        var s = xhr.status,
            result
        if (s >= 200 && s < 300) {
            switch (type) {
            case 'text':
                result = xhr.responseText
                break
            case 'json':
                result = JSONParse(xhr.responseText)
                break
            case 'xml':
                result = xhr.responseXML
                break
            }
            // text, 返回空字符时执行success
            // json, 返回空对象{}时执行suceess，但解析json失败，函数没有返回值时默认返回undefined
            result !== undefined && success.call(scope, result)

        } else {
            failure(xhr, xhr.status)
        }
        xhr = null
    }
    // exports _ajax obj with method request,jsonp,get,post
    var _ajax = {
        request: request,
        jsonp : function(url,data,callback,jsonpName){
            if(_type.isFunction(data)){
                jsonpName = callback
                callback = data 
                data = undefined
            }
            return request({
                url : url,
                data : data ,
                success : callback,
                type : "jsonp",
                jsonpName : jsonpName||"callback"
            });
        }
    }
    forEach(['get','post'],function(method){
        _ajax[method] = function(url,data,success,failure){
            if(_type.isFunction(data)){
                failure = success
                success = data 
                data = undefined
            }
            return request({
                url : url ,
                data : data,
                method : method,
                success : success,
                failure : failure
            });
        }
    }) 
    return _ajax;
});