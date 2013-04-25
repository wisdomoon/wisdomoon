! function (definition) {
    if (typeof define === "function" && define.amd) {
        // Register as an AMD module.
        define(definition);
    } else {
        // Browser globals
        window.JSONP = definition();
    }
}(function () {
    if (!window.JSONP)
        var JSONP = (function () {
            var counter = 0,
                head, window = this,
                config = {};

            function getRandomId() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) + "_" + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }

            function load(url, pfnError) {
                var script = document.createElement('script'),
                    done = false;
                script.src = url;
                script.async = true;

                var errorHandler = pfnError || config.error;
                if (typeof errorHandler === 'function') {
                    script.onerror = function (ex) {
                        errorHandler({
                            url: url,
                            event: ex
                        });
                    };
                }

                script.onload = script.onreadystatechange = function () {
                    if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                        done = true;
                        script.onload = script.onreadystatechange = null;
                        if (script && script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                    }
                };

                if (!head) {
                    head = document.getElementsByTagName('head')[0];
                }
                head.appendChild(script);
            }

            function encode(str) {
                return encodeURIComponent(str);
            }

            function jsonp(url, params, callback, callbackName) {
                var query = (url || '').indexOf('?') === -1 ? '?' : '&',
                    key;
                var type = "";
                params = params || {};
                callbackName = callbackName || config['callbackName'] || "callback";
                if (!params.vn || params.cb) {
                    params.cb = (params.cb || callbackName) + "_jsonp_cb" + getRandomId();
                    type = "cb";
                } else {
                    params.vn = (params.vn || "") + "_jsonp_vn" + getRandomId();
                    type = "vn";
                }
                for (key in params) {
                    if (params.hasOwnProperty(key)) {
                        query += encode(key) + "=" + encode(params[key]) + "&";
                    }
                }
                if (type == "cb") {
                    window[params.cb] = function (data) {
                        callback(data);
                        try {
                            delete window[params.cb];
                        } catch (e) {}
                        window[params.cb] = null;
                    };
                }
                if (type == "vn") {
                    var tempInterval = setInterval(function () {
                        if (window[params.vn]) {
                            callback(window[params.vn]);
                            clearInterval(tempInterval);
                            try {
                                delete window[params.vn];
                            } catch (e) {}
                            window[params.vn] = null;
                        }
                    }, 50)
                }
                load(url + query);
                return params.cb || params.vn;
            }

            function setDefaults(obj) {
                config = obj;
            }
            return {
                get: jsonp,
                init: setDefaults
            };
        }());
    return JSONP;
});