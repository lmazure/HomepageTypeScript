/// <reference path ="jquery.d.ts"/>
/// <reference path ="google.analytics.d.ts"/>

interface Author {
    namePrefix:string;
    firstName:string;
    middleName:string;
    lastName:string;
    nameSuffix:string;
    givenName:string;
}

interface Link {
    url:string;
    title:string;
    subtitle:string;
    duration:number[];
    formats:string[];
    languages:string[];
}

interface Article {
    links:Link[];
    date:number[];
    authorIndexes:number[];
    referringPage:string;
}

interface mapNode {
    title:string;
    page:string;
    languages:string[];
    formats:string[];
    children:mapNode[];
}

class ContentBuilder {

    constructor() {
    }

    buildContent():void {
        this.getAuthors();
    }

    private getAuthors():void {
        const authorsRequest = new XMLHttpRequest();
        const that:ContentBuilder = this;
        authorsRequest.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const myObj:any = JSON.parse(this.responseText);
                //document.getElementById("content").innerHTML = that.buildContentText(myObj.authors);
                that.getArticles();
            }
        };
        authorsRequest.open("GET", "../content_tables/author.json");
        authorsRequest.send();        
    }

    private getArticles(): void {
        const articlesRequest = new XMLHttpRequest();
        const that:ContentBuilder = this;
        articlesRequest.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const myObj:any = JSON.parse(this.responseText);
                document.getElementById("content").innerHTML = that.buildContentText(myObj.articles);
            }
        };
        articlesRequest.open("GET", "../content_tables/article.json");
        articlesRequest.send();        
    }

    /*private buildContentText(authors:Author[]):string {
        let fullString:string = "";
        for (let i = 0; i < authors.length; i++) {
            const author:Author = authors[i];
            fullString += "namePrefix = " + author.namePrefix + "<BR/>"
                        + "firstName = " + author.firstName + "<BR/>"
                        + "middleName = " + author.middleName + "<BR/>"
                        + "lastName = " + author.lastName + "<BR/>"
                        + "nameSuffix = " + author.nameSuffix + "<BR/>"
                        + "givenName = " + author.givenName + "<BR/>"
                        + "<BR/>";
        }
        return fullString;
    }*/

    private buildContentText(articles:Article[]):string {
        let fullString:string = "";
        for (let i = 0; i < articles.length; i++) {
            const article:Article = articles[i];
            for (let j=0; j < article.links.length; j++) {
                const link:Link = article.links[j];                
                fullString += "link n°" + j + "<BR/>"
                            + "url = " + link.url + "<BR/>"
                            + "title = " + link.title + "<BR/>"
                            + "subtitle = " + link.subtitle + "<BR/>"
                            + "duration = " + ((link.duration === undefined) ? undefined : link.duration.join()) + "<BR/>"
                            + "formats = " + link.formats.join() + "<BR/>"
                            + "languages = " + link.languages.join() + "<BR/>";
            }
            fullString += "date = " + ((article.date === undefined) ? undefined : article.date.join()) + "<BR/>"
                        + "authorIndexes = " + ((article.authorIndexes === undefined) ? undefined : article.authorIndexes.join()) + "<BR/>"
                        + "referringPage = " + article.referringPage + "<BR/>"
                        + "<BR/>"
        }
        return fullString;
    }

}

class MapBuilder {

    divCounter:number = 0;
    static openedNodeSymbol:string = "\u25BC";
    static closedNodeSymbol:string = "\u25BA";
    static spanDivName:string = "spanDiv";
    static toggleDivName:string = "toggleDiv";

    constructor() {
    }

    buildMap():void  {
        const mapRequest = new XMLHttpRequest();
        const that:MapBuilder = this;
        mapRequest.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                const myObj:any = JSON.parse(this.responseText);
                document.getElementById("content").innerHTML = that.buildNodeText(myObj.root, 0);
            }
        };
        mapRequest.open("GET", "../hack/map.json");
        mapRequest.send();    
    }

    public handleNodeClick(index:number):boolean {
        if ($("#" + MapBuilder.spanDivName + index).is(":visible")) {
            $("#" + MapBuilder.spanDivName + index).hide();
            document.getElementById(MapBuilder.toggleDivName + index).innerHTML = MapBuilder.closedNodeSymbol;
        } else {
            $("#" + MapBuilder.spanDivName + index).show();
            document.getElementById(MapBuilder.toggleDivName + index).innerHTML = MapBuilder.openedNodeSymbol;
        }
        return(false);
    }

    private buildNodeText(node:mapNode, depth:number):string {
        let str:string = "";
        for (let i=0; i < depth; i++) {
            str += "&nbsp;&nbsp;&nbsp;&nbsp;";
        }
        if (node.page == undefined) {
            str += escapeHtml(node.title);
        } else {
            str += "<A href=\"../" + node.page + "\" title=\"language:";
            for (var i=0; i < node.languages.length; i++) {
                str += " " + node.languages[i];
            }
            str += " | format:";
            for (let i=0; i < node.formats.length; i++) {
                str += " " + node.formats[i];
            }
            str += "\" target=\"_self\"><span class=\"linktitle\">" + escapeHtml(node.title) +"</span></A>";
        }
        if (node.children == undefined) {
            str += "<BR/>";
        } else {
            str += "<A onclick=\"MapBuilder.prototype.handleNodeClick(" 
                    + this.divCounter
                    + ")\" id=\""
                    + MapBuilder.toggleDivName + this.divCounter
                    + "\">" 
                    + MapBuilder.openedNodeSymbol
                    + "</A><BR/><SPAN id=\""
                    + MapBuilder.spanDivName + this.divCounter
                    + "\">"
            this.divCounter++;
            for (let i=0; i<node.children.length; i++) {
                str += this.buildNodeText(node.children[i], depth + 1);
            }
            str += "</SPAN>";
        }
        return str;
    }
}

function escapeHtml(unsafe:string):string {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

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
        url = "http://www.ietf.org/rfc/rfc"+a[1]+".txt";
    } else if ( a[0] == "man" && a[1] == "linux" ) {
        url = "http://man7.org/linux/man-pages/man"+a[2].substr(0,1)+"/"+a[3]+"."+a[2]+".html";
    } else if ( a[0] == "man" && a[1] == "macosx" ) {
        url = "https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man"+a[2]+"/"+a[3]+"."+a[2]+".html";
    } else if ( a[0] == "man" && a[1] == "x11" ) {
        url = "http://www.x.org/X11R6.8.2/doc/"+a[3]+"."+a[2]+".html"
    } else if ( a[0] == "j2se" && a.length == 2 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g,"/") + ".html";
    } else if ( a[0] == "j2se" && a.length == 3 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g,"/") + ".html#" + escapeHtml(a[2]);
    } else if ( a[0] == "clearcase" && a.length == 2 ) {
        url = "http://www.agsrhichome.bnl.gov/Controls/doc/ClearCaseEnv/v4.0doc/cpf_4.0/ccase_ux/ccref/" + a[1] + ".html";
    }
    window.open(url,'_blank');
}

// ---------------------------------------------------------------------------------------------------------------

declare function postInitialize():void;

function initialize():void {
    var currdate : any = new Date();
  
    /* tslint:disable:no-string-literal */
    /* tslint:disable:semicolon */
    /* tslint:disable:no-unused-expression */
    // This code is from Google, so let's not modify it too much
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*currdate;a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    /* tslint:enable:no-unused-expression */
    /* tslint:enable:semicolon */
    /* tslint:enable:no-string-literal */
  
  ga('create', 'UA-45789787-1', 'auto');
  ga('send', 'pageview');

  if (typeof postInitialize === "function") {
    postInitialize();
  }
}

window.onload=initialize;
