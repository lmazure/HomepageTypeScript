/// <reference path ="jquery.d.ts"/>
/// <reference path ="google.analytics.d.ts"/>

class MyClass {
    greet(): void {
        console.log("Hello, planet 42!");
    }
}

interface Author {
    namePrefix:string;
    firstName:string;
    middleName:string;
    lastName:string;
    nameSuffix:string;
    givenName:string;
}

var myObject = new MyClass();
myObject.greet();

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var myObj = JSON.parse(this.responseText);
        var fullString:string = "";
        for (var i = 0; i < myObj.authors.length; i++) {
            var author:Author = myObj.authors[i];
            fullString += "namePrefix = " + author.namePrefix + "<BR/>"
                        + "firstName = " + author.firstName + "<BR/>"
                        + "middleName = " + author.middleName + "<BR/>"
                        + "lastName = " + author.lastName + "<BR/>"
                        + "nameSuffix = " + author.nameSuffix + "<BR/>"
                        + "givenName = " + author.givenName + "<BR/>"
                        + "<BR/>";
        }
        document.getElementById("demo").innerHTML = fullString;
    }
};
xmlhttp.open("GET", "author.json");
xmlhttp.send();






function create_index() {
    var letters:string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var w:number = 100.0/letters.length;
    var str:string = '<table id="navigationBar" width="100%"><TR>';
    for (var i:number = 0; i < letters.length; i++ ) {
        str += '<td align="center" width="'
               + w
               + '%"><a href="#'
               + letters.charAt(i)
               + '">'
               + letters.charAt(i)
               + '</a></td>';
    }
  str += '<tr></table>';
  $("body").prepend(str);
}

// ---------------------------------------------------------------------------------------------------------------

function do_email() {
    window.location.href = "mailto:"
                           + "lmazure.website%40gmail.com"
                           + "?subject="
                           + encodeURIComponent("about the '"
                               + document.title
                               +"' page");
}

// ---------------------------------------------------------------------------------------------------------------

function display_search() {
    $("#searchPanel").slideToggle({
        progress: function() {
            scrollTo(0,document.body.scrollHeight);
        },
        done: function() {
            if ($("#searchPanel").is(":visible")) {
                $("#searchPanel>#panel>#text").focus();	
            }
        }
    });
}

// ---------------------------------------------------------------------------------------------------------------

function do_search() {
  var request:string = "http://www.google.com/search?as_sitesearch=mazure.fr&q=";
  //var terms:string[] = document.search.terms.value.split(" ");
  var terms:string[] = (<string>($("#searchPanel>#panel>#text").val())).split(" ");
  for (var i:number = 0; i < terms.length; i++) {
    if (terms[i] != "") { // to avoid additional space characters
      if (i>0) request += "+";
      request += terms[i];
    }
  }
  open(request, '_blank');
}

// ---------------------------------------------------------------------------------------------------------------

// rfc/<rfc-number>
// man/linux/<man-section-number>/<command>
// man/macosx/<man-section-number>/<command>
// man/x11/<man-section-number>/<command>
// j2se/<class>
// j2se/<class>/<method>
// clearcase/command

function do_reference(str) {
    var a:string = str.split("/");
    var url:string = "?";
    if ( a[0] == "rfc" ) {
        //url = "http://www.zvon.org/tmRFC/RFC"+a[1]+"/Output/index.html";
        url = "http://www.ietf.org/rfc/rfc"+a[1]+".txt";
    } else if ( a[0] == "man" && a[1] == "linux" ) {
        url = "http://man7.org/linux/man-pages/man"+a[2]+"/"+a[3]+"."+a[2]+".html";
    } else if ( a[0] == "man" && a[1] == "macosx" ) {
        url = "http://developer.apple.com/documentation/Darwin/Reference/ManPages/man"+a[2]+"/"+a[3]+"."+a[2]+".html";
    } else if ( a[0] == "man" && a[1] == "x11" ) {
        url = "http://www.x.org/X11R6.8.2/doc/"+a[3]+"."+a[2]+".html"
    } else if ( a[0] == "j2se" && a.length == 2 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g,"/") + ".html";
    } else if ( a[0] == "j2se" && a.length == 3 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g,"/") + ".html#" + escape(a[2]);
    } else if ( a[0] == "clearcase" && a.length == 2 ) {
        url = "http://www.agsrhichome.bnl.gov/Controls/doc/ClearCaseEnv/v4.0doc/cpf_4.0/ccase_ux/ccref/" + a[1] + ".html";
    }
    window.open(url,'_blank');
}

// ---------------------------------------------------------------------------------------------------------------

function initialize() {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-45789787-1', 'auto');
  ga('send', 'pageview');
}
  
window.onload=initialize;

