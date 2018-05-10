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

class HtmlString {

    html:string;

    private constructor() {
        this.html = "";
    }

    public static buildEmpty(): HtmlString {
        const that:HtmlString = new HtmlString();
        return that;
    }

    public static buildFromString(str:string | HtmlString): HtmlString {
        const that:HtmlString = new HtmlString();
        that.appendString(str);
        return that;
    }

    public static buildFromTag(tag:string, content:string | HtmlString, ...attributes:string[]) {
        const that:HtmlString = new HtmlString();
        that.performTagAppending(tag, content, attributes);
        return that;
    }

    public getHtml():string {
        return this.html;
    }

    public isEmpty():boolean {
        return (this.html.length == 0)
    }

    public appendString(str:string | HtmlString):HtmlString {
        this.html += (typeof str === "string") ? HtmlString.escape(str) : (str as HtmlString).getHtml();
        return this;
    }

    public appendEmptyTag(tag:string):HtmlString {
        this.html += "<" + tag + ">";
        return this;
    }

    public appendTag(tag:string, content:string | HtmlString, ...attributes:string[]):HtmlString {
        this.performTagAppending(tag, content, attributes);
        return this;
    }

    private performTagAppending(tag:string, content:string | HtmlString, attributes:string[]):void {
        if ((attributes.length % 2) != 0) {
            throw "illegal call to HtmlString.performTagAppending()"
        }
        let str = "<" + tag;
        for (let i:number =0; i<attributes.length; i += 2) {
            str += " " + attributes[i] + "=\"" + attributes[i + 1] + "\"";
        }
        str += ">"
                + ((typeof content === "string") ? HtmlString.escape(content) : (content as HtmlString).getHtml())
                + "</"
                + tag
                +">";
        this.html += str;
    }

    private static escape(unsafe:string):string {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }
}

enum ContentSort {
    Article,
    Author
};

class ContentBuilder {

    authors:Author[];
    articles:Article[];
    sort:ContentSort;
    static instance:ContentBuilder; //TODO burp!

    constructor() {
        this.sort = ContentSort.Article;
        ContentBuilder.instance = this;
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
                that.postprocessData();
                that.createTable();
            }
        };
        articlesRequest.open("GET", "../content_tables/article.json");
        articlesRequest.send();        
    }

    private createTable():void {
        document.getElementById("content").innerHTML = this.buildContentText().getHtml();
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

    private buildContentText():HtmlString {
        switch (this.sort) {
            case ContentSort.Article : return this.buildContentTextForArticleSort();
            case ContentSort.Author : return this.buildContentTextForAuthorSort();
        }
    }

    public switchToAuthorSort():void {
        ContentBuilder.instance.sort = ContentSort.Author;
        ContentBuilder.instance.createTable();
    }

    public switchToArticleSort():void {
        ContentBuilder.instance.sort = ContentSort.Article;
        ContentBuilder.instance.createTable();
    }

    private buildContentTextForArticleSort():HtmlString {
        const authorsLink = HtmlString.buildFromTag("a", "authors",
                                                    "href", "#",
                                                    "onclick", "ContentBuilder.prototype.switchToAuthorSort()",
                                                    "style", "cursor: pointer");
        const cells:HtmlString = HtmlString.buildFromTag("th", "title")
                                    .appendTag("th", authorsLink)
                                    .appendTag("th", "date")
                                    .appendTag("th", "URL")
                                    .appendTag("th", "language")
                                    .appendTag("th", "format")
                                    .appendTag("th", "duration")
                                    .appendTag("th", "referring page");
        const row:HtmlString = HtmlString.buildFromTag("tr", cells);
        for (let article of this.articles) {
            const title:HtmlString = ContentBuilder.getTitleCellFromLink(article.links[0]);
            const authors:HtmlString = ContentBuilder.getAuthorsCellFromArticle(article);
            const date:HtmlString = ContentBuilder.getDateCellFromArticle(article);
            const urls:HtmlString = ContentBuilder.getUrlCellFromArticle(article);
            const languages:HtmlString = ContentBuilder.getLanguageCellFromLink(article.links[0]);
            const formats:HtmlString = ContentBuilder.getFormatCellFromLink(article.links[0]);
            const duration:HtmlString = ContentBuilder.getDurationCellFromLink(article.links[0]);
            const referringPage:HtmlString =ContentBuilder.getReferringPageCellFromArticle(article);
            const cells:HtmlString = HtmlString
                                    .buildFromTag("td", title)
                                    .appendTag("td", authors)
                                    .appendTag("td", date)
                                    .appendTag("td", urls)
                                    .appendTag("td", languages)
                                    .appendTag("td", formats)
                                    .appendTag("td", duration)
                                    .appendTag("td", referringPage);
            row.appendTag("tr",cells);
        }
        const table:HtmlString = HtmlString.buildFromTag("table", row , "class", "table");
        const full:HtmlString = HtmlString.buildFromString("number of articles: " + this.articles.length)
                                        .appendString(table);
        return full;
    }

    private buildContentTextForAuthorSort():HtmlString {
        const articleLink = HtmlString.buildFromTag("a", "article",
                                                    "href", "#",
                                                    "onclick", "ContentBuilder.prototype.switchToArticleSort()",
                                                    "style", "cursor: pointer");
        const cells:HtmlString = HtmlString.buildFromTag("th", "authors")
                                           .appendTag("th", articleLink)
                                           .appendTag("th", "co-authors")
                                           .appendTag("th", "date")
                                           .appendTag("th", "URL")
                                           .appendTag("th", "language")
                                           .appendTag("th", "format")
                                           .appendTag("th", "duration")
                                           .appendTag("th", "referring page");
        const row:HtmlString = HtmlString.buildFromTag("tr", cells);
        for (let author of this.authors) {
            let first:boolean = true;
            for (let article of author.articles) {
                const title:HtmlString = ContentBuilder.getTitleCellFromLink(article.links[0]);
                const coauthors:HtmlString = ContentBuilder.getCoauthorsCellFromArticle(article, author);
                const date:HtmlString = ContentBuilder.getDateCellFromArticle(article);
                const urls:HtmlString = ContentBuilder.getUrlCellFromArticle(article);
                const languages:HtmlString = ContentBuilder.getLanguageCellFromLink(article.links[0]);
                const formats:HtmlString = ContentBuilder.getFormatCellFromLink(article.links[0]);
                const duration:HtmlString = ContentBuilder.getDurationCellFromLink(article.links[0]);
                const referringPage:HtmlString =ContentBuilder.getReferringPageCellFromArticle(article);
                const cells:HtmlString = first ? HtmlString.buildFromTag("td", ContentBuilder.authorToHtmlString(author),
                                                                         "rowspan", author.articles.length.toString())
                                               : HtmlString.buildEmpty();
                cells.appendTag("td", title)
                     .appendTag("td", coauthors)
                     .appendTag("td", date)
                     .appendTag("td", urls)
                     .appendTag("td", languages)
                     .appendTag("td", formats)
                     .appendTag("td", duration)
                     .appendTag("td", referringPage);
                row.appendTag("tr",cells);
                first = false;
            }    
        }
        const table:HtmlString = HtmlString.buildFromTag("table", row , "class", "table");
        const full:HtmlString = HtmlString.buildFromString("number of articles: " + this.articles.length)
                                        .appendString(table);
        return full;
    }

    private static getTitleCellFromLink(link:Link):HtmlString {
        const title:HtmlString = HtmlString.buildFromString(link.title);
        if (link.subtitle !== undefined) {
            title.appendEmptyTag("br")
                .appendString(link.subtitle);
        }
        return title;
    }

    private static getAuthorsCellFromArticle(article:Article):HtmlString {
        return ContentBuilder.getCoauthorsCellFromArticle(article, undefined);
    }

    private static getCoauthorsCellFromArticle(article:Article, author:Author):HtmlString {
        const authors:HtmlString = HtmlString.buildEmpty();
        if (article.authors !== undefined) {
            let flag:boolean = false;
            for (let a of article.authors) {
                if (a !== author) {
                    if (flag) {
                        authors.appendEmptyTag("br");
                    } else {
                        flag = true;
                    }
                    authors.appendString(ContentBuilder.authorToHtmlString(a));    
                }
            }
        }
        return authors;
    }

    private static getDateCellFromArticle(article:Article):HtmlString {
        const date:HtmlString = (article.date !== undefined)
        ? HtmlString.buildFromString(ContentBuilder.dateToHtmlString(article.date))
        : HtmlString.buildEmpty();
        return date;
    }

    private static getUrlCellFromArticle(article:Article):HtmlString {
        const urls:HtmlString = HtmlString.buildEmpty();
        {
            let flag:boolean = false;
            for (let l of article.links) {
                if (flag) {
                    urls.appendEmptyTag("br");
                } else {
                    flag = true;
                }
                urls.appendTag(
                    "a",
                    l.url,
                    "href", l.url,
                    "title",
                        "language: "
                        + l.languages.join(" ")
                        + " | format: "
                        + l.formats.join(" ")
                        + ((l.duration === undefined)
                            ? ""
                            : (" | duration: " + ContentBuilder.durationToString(l.duration))),
                    "target", "_blank"
                );
                if (l.protection !== undefined) {
                    urls.appendString(ContentBuilder.protectionToHtmlString(l.protection));
                }
                if (l.status !== undefined) {
                    urls.appendString(ContentBuilder.statusToHtmlString(l.status));
                }
            }
        }            
        return urls;
    }

    private static getLanguageCellFromLink(link:Link):HtmlString {
        const languages:HtmlString = HtmlString.buildEmpty();
        {
            let flag:boolean = false;
            for (let l of link.languages) {
                if (flag) {
                    languages.appendEmptyTag("br");
                } else {
                    flag = true;
                }
                languages.appendString(l);
            }                
        }
        return languages;
    }

    private static getFormatCellFromLink(link:Link):HtmlString {
        const formats:HtmlString = HtmlString.buildEmpty();
        {
            let flag:boolean = false;
            for (let l of link.formats) {
                if (flag) {
                    formats.appendEmptyTag("br");
                } else {
                    flag = true;
                }
                formats.appendString(l);
            }                
        }
        return formats;
    }

    private static getDurationCellFromLink(link:Link):HtmlString {
        const duration:HtmlString = (link.duration !== undefined)
        ? ContentBuilder.durationToHtmlString(link.duration)
        : HtmlString.buildEmpty();
        return duration;
    }

    private static getReferringPageCellFromArticle(article:Article):HtmlString {
        const referringPage:HtmlString =
                HtmlString.buildFromTag(
                    "a",
                    article.page,
                    "href", "../" + article.page,
                    "title", "language: en | format: HTML", //TODO do not hardcode language and format
                    "target", "_self"
                );
        return referringPage;
    }

    private static authorToHtmlString(author:Author):HtmlString {
        let fullString:HtmlString = HtmlString.buildEmpty();
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.namePrefix);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.firstName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.middleName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.lastName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.nameSuffix);
        return this.appendSpaceAndPostfixToHtmlString(fullString, author.givenName);
    }

    private static durationToHtmlString(duration:number[]):HtmlString {
        return HtmlString.buildFromString(ContentBuilder.durationToString(duration));
    }

    private static durationToString(duration:number[]):string {
        switch (duration.length) {
            case 3: return duration[0] + "h " + duration[1] + "m " + duration[2] + "s";
            case 2: return duration[0] + "m " + duration[1] + "s";
            case 1: return duration[0] + "s";
        }
        throw "illegal call to buildContentText.durationToString() (duration.length=" + duration.length + ")";
    }

    private static dateToHtmlString(date:number[]):HtmlString {
        switch (date.length) {
            case 3: return ContentBuilder
                        .monthToHtmlString(date[1])
                        .appendString(" ")
                        .appendString(ContentBuilder.dayToHtmlString(date[2]))
                        .appendString(", " + date[0]);
            case 2: return ContentBuilder
                        .monthToHtmlString(date[1])
                        .appendString(" " + date[0]);
            case 1: return HtmlString
                        .buildFromString("" + date[0]);
        }
        throw "illegal call to buildContentText.dateToHtmlString()";
    }

    private static dayToHtmlString(day:number):HtmlString {
        switch (day) {
            case  1: return HtmlString.buildFromString("1").appendTag("sup", "st");
            case 21: return HtmlString.buildFromString("21").appendTag("sup", "st");
            case 31: return HtmlString.buildFromString("31").appendTag("sup", "st");
            case  2: return HtmlString.buildFromString("2").appendTag("sup", "nd");
            case 22: return HtmlString.buildFromString("22").appendTag("sup", "nd");
            case  3: return HtmlString.buildFromString("3").appendTag("sup", "rd");
            case 23: return HtmlString.buildFromString("23").appendTag("sup", "rd");
            default: return HtmlString.buildFromString(" " + day).appendTag("sup", "th");
        }
    }

    private static monthToHtmlString(month:number):HtmlString {
        switch (month) {
            case  1: return HtmlString.buildFromString("January");
            case  2: return HtmlString.buildFromString("February");
            case  3: return HtmlString.buildFromString("March");
            case  4: return HtmlString.buildFromString("April");
            case  5: return HtmlString.buildFromString("May");
            case  6: return HtmlString.buildFromString("June");
            case  7: return HtmlString.buildFromString("July");
            case  8: return HtmlString.buildFromString("August");
            case  9: return HtmlString.buildFromString("September");
            case 10: return HtmlString.buildFromString("October");
            case 11: return HtmlString.buildFromString("November");
            case 12: return HtmlString.buildFromString("December");
        }
        throw "illegal call to buildContentText.monthToHtmlString()";
    }

    private static appendSpaceAndPostfixToHtmlString(str:HtmlString, postfix:string|undefined):HtmlString {
        if (postfix !== undefined) {
            if (str.isEmpty()) {
                return str.appendString(postfix);
            } else {
                return str.appendString(" " + postfix);
            }
        } else {
            return str;
        }
    }

    private static protectionToHtmlString(protection:string):HtmlString {
        if (protection === "free_registration") {
            return HtmlString.buildFromTag(
                "span",
                "\u{1f193}",
                "title", "free registration required"
            )
        }
        if (protection === "payed_registration") {
            return HtmlString.buildFromTag(
                "span",
                "\u{1f4b0}",
                "title", "payed registration required"
            )
        }
        throw "illegal call to buildContentText.protectionToHtmlString() (unknown value = \"" + protection + "\")";
    }
    
    private static statusToHtmlString(protection:string):HtmlString {
        if ((protection === "dead") || (protection === "zombie")) {
            return HtmlString.buildFromTag(
                "span",
                "\u{2020}",
                "title", "dead link"
            )
        }
        throw "illegal call to buildContentText.statusToHtmlString() (unknown value = \"" + protection + "\")";
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
