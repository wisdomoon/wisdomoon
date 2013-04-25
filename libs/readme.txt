1.This is the first lightweight lib I wrote
2.It is the JSONP lib with origin javascript
3.Compared to other libraries, the library can support return  global functions and global variables from anoter domains
4.when the callback function resoveld the data  the global variables or functions will be destroyed
5.egs:
     JSONP.get(url,{name:"zhangsan"},function(data){
        if(data.code =="0"){
	        /*
	          dosomething
	         */
        }
     });

     this js sopport the remote program returns callback_jsonp_cb_23af_312a({"code":0,msg:"success"})  or  var callback_jsonp_vn_21as_davg =  {"code":0,msg:"success"}