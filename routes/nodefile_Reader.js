//here we monitor for file modification and get data from the web server depending on that and write to output file or send data to droid

var fs=require("fs");
var nconf = require('nconf');
var https=require("https");
var XmlDocument = require('xmldoc').XmlDocument;
var options;
var pressure1=new Array();
var pressure2=new Array();
var pressure3=new Array();
var pressure4=new Array();
var pressure5=new Array();
var pressure6=new Array();

var requestKandy;


// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

// Then load configuration from a designated file.
var conf =  require('../config.json');

var UserId = conf.user;
var Password = conf.password;

var APIKey = conf.APIKey;
var feedID =  conf.feedID;

var optionsKandy = {

    host: 'api.kandy.io',
    path: '/v1.1/domains/users/accesstokens?key=&user_id=' +UserId+'&user_password='+Password

};

var optionsDaily= {
    host: 'ice.connect2.me',
    path: '/ice.svc/GetData?apikey='+APIKey+'=&feedID='+feedID+'=&parameterType=LIST&filtertype=TimePeriodName&filtervalue=Daily'
};

var optionsWeekly= {
    host: 'ice.connect2.me',
    path: '/ice.svc/GetData?apikey='+APIKey+'=&feedID='+feedID+'=&parameterType=LIST&filtertype=TimePeriodName&filtervalue=Weekly'
};

var optionsMonthly= {
    host: 'ice.connect2.me',
    path: '/ice.svc/GetData?apikey='+APIKey+'=&feedID='+feedID+'=&parameterType=LIST&filtertype=TimePeriodName&filtervalue=Monthly'
};

var optionsSingle= {
    host: 'ice.connect2.me',
    path: '/ice.svc/GetData?apikey='+APIKey+'=&feedID='+feedID+'=&parameterType=LIST&filtertype=TotalNoOfRecords&filtervalue=1&StartRecord=0'
};

fs.watchFile("syncfile.txt", function (current, previous) {
    //depending on current value use options
    var cntnt = fs.readFileSync("syncfile.txt");
    var requester = cntnt.toString();

    if(requester=='Daily'){
        options = optionsDaily;
    }
    else if(requester=='Weekly'){
        options = optionsWeekly;
    }
    else if(requester=='Monthly'){
        options = optionsMonthly;
    }
    else if(requester=='Single'){
        options = optionsSingle;
    }
    if(requester=='Daily'||requester=='Weekly'||requester=='Monthly'){
        var request = https.request(options, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                var xmlstring = data;
                var newone = new XmlDocument(xmlstring);
                var last = newone.firstChild;
                pressure1 = new Array();
                pressure2 = new Array();
                pressure3 = new Array();
                pressure4 = new Array();
                pressure5 = new Array();
                pressure6 = new Array();
                var count = 0;
                last.firstChild.eachChild(function (table) {
                    x = (table.childNamed("pressure1").val);
                    pressure1.push(x);

                    x = (table.childNamed("pressure2").val);
                    pressure2.push(x);
                    x = (table.childNamed("pressure3").val);
                    pressure3.push(x);
                    x = (table.childNamed("pressure4").val);
                    pressure4.push(x);
                    x = (table.childNamed("pressure5").val);
                    pressure5.push(x);
                    x = (table.childNamed("pressure6").val);
                    pressure6.push(x);

                    count++;
                });
                var p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
                for (var i = 0; i < count; i++) {
                    p1 += parseInt(pressure1[i]);
                    p2 += parseInt(pressure2[i]);
                    p3 += parseInt(pressure3[i]);
                    p4 += parseInt(pressure4[i]);
                    p5 += parseInt(pressure5[i]);
                    p6 += parseInt(pressure6[i]);
                }
                ;

                //take average to calculate score
                var pper1 = p1 / count;
                var pper2 = p2 / count;
                var pper3 = p3 / count;
                var pper4 = p4 / count;
                var pper5 = p5 / count;
                var pper6 = p6 / count;
                var avg = (pper1 + pper2 + pper3 + pper4 + pper5 + pper6) * 100 / 6;
                avg = 100 - avg;
                var strn = {"score": ' +avg+'};
                if (avg > 65) {


                    requestKandy = https.request(optionsKandy, function (res) {

                        console.log("Making request to Kandy");

                        var data = '';
                        res.on('data', function (chunk) {

                            var value = chunk;

                            console.log("chunk " + value);

                            var neededString = value.toString().split(':')[2].split('}')[0];

                            var user_access_token = neededString.substring(1, neededString.length - 1);

                            console.log("user_access_token " + user_access_token);
                            var innerOptionsKandy = {

                                host: 'api.kandy.io',
                                path: '/v1.1/users/devices?key=' + user_access_token

                            };

                            var innerReq = https.request(innerOptionsKandy, function (res1) {
                                res1.on('data', function (chunk2) {

                                    console.log("chunk2 " + chunk2);
                                    var neededStr = chunk2.toString().split(':')[3].split(',')[0];
                                    var deviceId = neededStr.substring(1, neededStr.length - 1);
                                    var msg = {
                                        message: {
                                            source: "1 xxx xxx xxxx", // source phone number
                                            destination: "1 xxx xxx xxxx", // destination phone number
                                            message: {text: "You have been sitting for too long!!! Your Score is : " + Math.ceil(avg)}
                                        }
                                    };

                                    var msgPayload = JSON.stringify(msg);

                                    var headers = {
                                        'Content-Type': 'application/json',
                                        'Content-Length': msgPayload.length
                                    };

                                    var lastButOneOptionsKandy = {

                                        host: 'api.kandy.io',
                                        method: 'POST',
                                        headers: headers,
                                        path: '/v1.1/devices/smss?device_id=' + deviceId + '&key=' + user_access_token

                                    };

                                    var lastRequest = https.request(lastButOneOptionsKandy, function (res3) {

                                        res3.on('data', function (chunk3) {
                                            console.log("chunk3 " + chunk3);
                                        });

                                        console.log("device ID " + deviceId);

                                    });
                                    lastRequest.on('error', function (e) {
                                        console.log("requestKandy" + e.message);
                                    });
                                    lastRequest.write(msgPayload);
                                    lastRequest.end();

                                });

                            });

                            innerReq.on('error', function (e) {
                                console.log("inner error");
                                console.log(e.message);
                            });

                            innerReq.end();

                        });

                        console.log("data " + data);

                    });


                    requestKandy.on('error', function (e) {
                        console.log("requestKandy" + e.message);
                    });

                    requestKandy.end();

                }

                fs.writeFile("connect2mefile.txt", avg);
            });
        });
    }
    else if(requester=='Single'){
        var request = https.request(options, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                var xmlstring = data;
                var newone = new XmlDocument(xmlstring);
                var last = newone.firstChild;
                pressure1 = new Array();
                pressure2 = new Array();
                pressure3 = new Array();
                pressure4 = new Array();
                pressure5 = new Array();
                pressure6 = new Array();
                var count = 0;
                last.firstChild.eachChild(function (table) {
                    x = (table.childNamed("pressure1").val);
                    pressure1.push(x);

                    x = (table.childNamed("pressure2").val);
                    pressure2.push(x);
                    x = (table.childNamed("pressure3").val);
                    pressure3.push(x);
                    x = (table.childNamed("pressure4").val);
                    pressure4.push(x);
                    x = (table.childNamed("pressure5").val);
                    pressure5.push(x);
                    x = (table.childNamed("pressure6").val);
                    pressure6.push(x);

                    count++;
                });
                var p1;
                for (var i = 0; i < count; i++) {
                    p1 += (pressure1[i]);
                    p1 += (pressure2[i]);
                    p1 += (pressure3[i]);
                    p1 += (pressure4[i]);
                    p1 += (pressure5[i]);
                    p1 += (pressure6[i]);
                }
                ;
                console.log(p1);

                fs.writeFile("connect2mefile.txt", p1);
            });
        });
    }
    request.on('error', function (e) {
        console.log(e.message);
    });
    request.end();

});