/// <reference path ="jquery.d.ts"/>
/// <reference path ="google.analytics.d.ts"/>

interface Author {
    namePrefix:string;
    firstName:string;
    middleName:string;
    lastName:string;
    nameSuffix:string;
    givenName:string;
    articles:Article[]|undefined;
}

interface Link {
    url:string;
    title:string;
    subtitle:string;
    duration:number[];
    formats:string[];
    languages:string[];
    status:string;
    protection:string;
}

interface Article {
    links:Link[];
    date:number[];
    authorIndexes:number[]|undefined;
    authors:Author[]|undefined;
    page:string;
}

interface mapNode {
    title:string;
    page:string;
    languages:string[];
    formats:string[];
    children:mapNode[];
}

class ContentBuilder {

    authors:Author[];
    articles:Article[];

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
                that.authors = myObj.authors;
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
                that.articles = myObj.articles;
                that.createTable();
            }
        };
        articlesRequest.open("GET", "../content_tables/article.json");
        articlesRequest.send();        
    }

    private createTable():void {
        this.postprocessData();
        document.getElementById("content").innerHTML = this.buildContentText();
    }

    private postprocessData():void {
        for (let article of this.articles) {
            if (article.authorIndexes !== undefined) {
                article.authors = article.authorIndexes.map(i => this.authors[i]);
                for (let author of article.authors) {
                    if (author.articles === undefined) {
                        author.articles = [ article ];
                    } else {
                        author.articles.push(article);
                    }
                }    
            }
        }
    }

    private buildContentText():string {
        let fullString:string = "number of articles: "
                            + this.articles.length
                            + "<table class=\"table\">"
                            + "<tr>"
                            + "<th>title</th><th>authors</a></th><th>date</th><th>URL</a></th><th>language</th><th>format</th><th>duration</th><th>referring page</th>"
                            + "</tr>";
        for (let article of this.articles) {
            let j:number = 0;
            let articleString = "<tr>"
                                + "<td>"
                                + escapeHtml(article.links[0].title)
                                + ((article.links[0].subtitle !== undefined) ? ("<br/><i>" + escapeHtml(article.links[0].subtitle) + "</i><br>") : "")
                                + "</td><td>"
                                + ((article.authors == undefined) ? "" : article.authors.map(a => ContentBuilder.authorToString(a)).join("<br>"))
                                + "</td><td>"
                                + ((article.date === undefined) ? "" : ContentBuilder.dateToString(article.date))
                                + "</td><td>";
            let flag:boolean = false;
            for (let link of article.links) {
                if (flag) {
                    articleString += "<br/>";
                } else {
                    flag = true;
                }
                articleString += "<a href=\""
                            + link.url
                            + "\" title=\"language: "
                            + link.languages.join(" ")
                            + " | format: "
                            + link.formats.join()
                            + ((link.duration === undefined) ?  "" : (" | duration: " + ContentBuilder.durationToString(link.duration)))
                            + "\" target=\"_blank\"><span class=\"linktitle\">"
                            + escapeHtml(link.url)
                            + "</span></a>"
                            + ContentBuilder.protectionToString(link.protection)
                            + ContentBuilder.statusToString(link.status);
            }
            articleString += "</td><td>"
                            + article.links[0].languages.join("<br/>")
                            + "</td><td>"
                            + article.links[0].formats.join("<br/>")
                            + "</td><td>"
                            + ((article.links[0].duration === undefined) ?  "" : ContentBuilder.durationToString(article.links[0].duration))
                            + "</td><td><a href=\"../"
                            + article.page
                            + "\" title=\"language: en | format: HTML \" target=\"_self\"><span class=\"linktitle\">"
                            + article.page
                            + "</span></a></td></tr>";
            fullString += articleString;
        }
        fullString += "</table>";
        return fullString;
    }

    private static authorToString(author:Author):string {
        let fullString:string = this.appendSpaceAndPostfixToString("", author.namePrefix);
        fullString = this.appendSpaceAndPostfixToString(fullString, author.firstName);
        fullString = this.appendSpaceAndPostfixToString(fullString, author.middleName);
        fullString = this.appendSpaceAndPostfixToString(fullString, author.lastName);
        fullString = this.appendSpaceAndPostfixToString(fullString, author.nameSuffix);
        return this.appendSpaceAndPostfixToString(fullString, author.givenName);
    }

    private static durationToString(duration:number[]):string {
        switch (duration.length) {
            case 3: return duration[0] + "h " + duration[1] + "m " + duration[2] + "s";
            case 2: return duration[0] + "m " + duration[1] + "s";
            case 1: return duration[0] + "s";
        }
        throw "illegal call to durationToString";
    }

    private static dateToString(date:number[]):string {
        switch (date.length) {
            case 3: return ContentBuilder.monthToString(date[1]) + " " + ContentBuilder.dayToString(date[2]) +", " + date[0];
            case 2: return ContentBuilder.monthToString(date[1]) + " " + date[0];
            case 1: return "" + date[0];
        }
        throw "illegal call to durationToString";
    }

    private static dayToString(day:number):string {
        switch (day) {
            case 1: return "1<sup>st</sup>";
            case 21: return "21<sup>st</sup>";
            case 31: return "31<sup>st</sup>";
            case 2: return "2<sup>nd</sup>";
            case 22: return "22<sup>nd</sup>";
            case 3: return "3<sup>rd</sup>";
            case 23: return "23<sup>rd</sup>";
            default: return "" + day + "<sup>th</sup>";
        }
    }

    private static monthToString(month:number):string {
        switch (month) {
            case 1: return "January";
            case 2: return "February";
            case 3: return "March";
            case 4: return "April";
            case 5: return "May";
            case 6: return "June";
            case 7: return "July";
            case 8: return "August";
            case 9: return "September";
            case 10: return "October";
            case 11: return "November";
            case 12: return "December";
        }
        throw "illegal call to monthToString";
    }

    // the first string is an HTML string
    // the second string is a raw string
    private static appendSpaceAndPostfixToString(str:string, postfix:string|undefined):string {
        if (postfix !== undefined) {
            if (str.length > 0) {
                return str + " " + escapeHtml(postfix);
            } else {
                return postfix;
            }
        } else {
            return str;
        }
    }

    private static protectionToString(protection:string):string {
        if ( protection === undefined) {
            return "";
        }
        if (protection === "free_registration") {
            return "<span title=\"free registration required\"> &#x1f193;</span>";            
        }
        if (protection === "payed_registration") {
            return "<span title=\"payed registration required\"> &#x1f4b0;</span>";            
        }
        throw "illegal call to protectionToString (unknown value = \"" + protection + "\")";
    }

    
    private static statusToString(protection:string):string {
        if ( protection === undefined) {
            return "";
        }
        if ((protection === "dead") || (protection === "zombie")) {
            return "<span title=\"dead link\"> &#x2020;</span>";            
        }
        throw "illegal call to protectionToString (unknown value = \"" + protection + "\")";
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
                    + "\"  style=\"cursor: pointer\">" 
                    + MapBuilder.openedNodeSymbol
                    + "</A><BR/><SPAN id=\""
                    + MapBuilder.spanDivName + this.divCounter
                    + "\">"
            this.divCounter++;
            for (let child of node.children) {
                str += this.buildNodeText(child, depth + 1);
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
    let letters:string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let w:number = 100.0/letters.length;
    let str:string = '<table id="navigationBar" width="100%"><TR>';
    for (let i:number = 0; i < letters.length; i++ ) {
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

function do_reference(str:string) {
    const a:string[] = str.split("/");
    let url:string = "?";
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
