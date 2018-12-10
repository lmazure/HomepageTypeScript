/// <reference path ="lib/jquery.d.ts"/>
/// <reference path ="lib/google.analytics.d.ts"/>

import HtmlString from "./HtmlString.js";

interface Author {
    namePrefix: string;
    firstName: string;
    middleName: string;
    lastName: string;
    nameSuffix: string;
    givenName: string;
    articles: Article[]|undefined;
}

interface Link {
    url: string;
    title: string;
    subtitle: string;
    duration: number[];
    formats: string[];
    languages: string[];
    status: string;
    protection: string;
    article: Article|undefined;
}

interface Article {
    links: Link[];
    date: number[];
    authorIndexes: number[];
    authors: Author[]|undefined;
    page: string;
}

interface MapNode {
    title: string;
    page: string;
    languages: string[];
    formats: string[];
    children: MapNode[];
    open: boolean|undefined;
}


enum ContentSort {
    Article = "article",
    Author= "author",
    Link = "link",
}

export default class ContentBuilder {

    private authors: Author[];
    private articles: Article[];
    private links: Link[];
    private referringPages: MapNode[];
    private sort: ContentSort;
    private static instance: ContentBuilder; // TODO burp!

    constructor() {
        switch (window.location.search) {
            case "?sort=link" : // TODO utiliser linkParameterString
                this.sort = ContentSort.Link;
                break;
            case "?sort=author" : // TODO utiliser authorParameterString
                this.sort = ContentSort.Author;
                break;
            default:
                this.sort = ContentSort.Article;
        }
        ContentBuilder.instance = this;
    }

    private buildContent(): void {
        this.getAuthors();
    }

    private getAuthors(): void {
        const authorsRequest = new XMLHttpRequest();
        const that: ContentBuilder = this;
        authorsRequest.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                const myObj: any = JSON.parse(this.responseText);
                that.authors = myObj.authors;
                that.getArticles();
            }
        };
        authorsRequest.open("GET", "../content/author.json");
        authorsRequest.send();
    }

    private getArticles(): void {
        const articlesRequest = new XMLHttpRequest();
        const that: ContentBuilder = this;
        articlesRequest.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                const myObj: any = JSON.parse(this.responseText);
                that.articles = myObj.articles;
                that.getMap();
            }
        };
        articlesRequest.open("GET", "../content/article.json");
        articlesRequest.send();
    }

    private getMap(): void  {
        const mapRequest = new XMLHttpRequest();
        const that: ContentBuilder = this;
        mapRequest.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                const myObj: any = JSON.parse(this.responseText);
                that.postprocessData(myObj.root);
                that.updateContent();
            }
        };
        mapRequest.open("GET", "../content/map.json");
        mapRequest.send();
    }

    private updateContent(): void {
        document.getElementById("content").innerHTML = this.buildContentText().getHtml();
        this.setGoToMapHref();
    }

    private postprocessData(rootNode: MapNode): void {
        this.links = [];
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
            for (let l of article.links) {
                l.article = article;
                this.links.push(l);
            }
        }
        for (let author of this.authors) {
            author.articles.sort(ContentBuilder.compareArticleByDate);
        }
        this.links.sort(function(l1: Link, l2: Link): number {
            const u1: string = l1.url.substring(l1.url.indexOf("://") + 1);
            const u2: string = l2.url.substring(l2.url.indexOf("://") + 1);
            return u1.localeCompare(u2);
        });
        this.referringPages = [];
        this.postProcessData_InserReferingPage(rootNode);
    }

    private static compareArticleByDate(article1: Article, article2: Article): number {
        if (article1.date === undefined) {
            if (article2.date === undefined) {
                return article1.links[0].title.localeCompare(article2.links[0].title);
            } else {
                return -1;
            }
        } else {
            if (article2.date === undefined) {
                return 1;
            } else {
                const str1: string = ""
                                   + article1.date[0]
                                   + ((article1.date.length >= 1) ? ("0" + article1.date[1]).slice(-2) : "")
                                   + ((article1.date.length >= 2) ? ("0" + article1.date[2]).slice(-2) : "");
                const str2: string = ""
                                   + article2.date[0]
                                   + ((article2.date.length >= 1) ? ("0" + article2.date[1]).slice(-2) : "")
                                   + ((article2.date.length >= 2) ? ("0" + article2.date[2]).slice(-2) : "");
                const diff: number = str1.localeCompare(str2);
                if (diff !== 0) {
                    return diff;
                } else {
                    return article1.links[0].title.localeCompare(article2.links[0].title);
                }
            }
        }
    }

    private postProcessData_InserReferingPage(node: MapNode): void {
        this.referringPages[node.page] = node;
        if (node.children !== undefined) {
            for (let c of node.children) {
                this.postProcessData_InserReferingPage(c);
            }
        }
    }

    private setGoToMapHref(): void {
        const goToMapHref: string = document.getElementById("goToMap")
                                            .getAttribute("href")
                                            .replace(/\/content\.html.*/, "/content.html?sort=" + this.sort);
        document.getElementById("goToMap")
                .setAttribute("href", goToMapHref);
    }

    private buildContentText(): HtmlString {
        switch (this.sort) {
            case ContentSort.Article :
                return this.buildContentTextForArticleSort();
            case ContentSort.Author :
                return this.buildContentTextForAuthorSort();
            case ContentSort.Link :
                return this.buildContentTextForLinkSort();
        }
    }

    public switchSort(sort: string): void {
        switch (sort) {
            case ContentSort.Article :
                ContentBuilder.instance.sort = ContentSort.Article;
                break;
            case ContentSort.Author :
                ContentBuilder.instance.sort = ContentSort.Author;
                break;
            case ContentSort.Link :
                ContentBuilder.instance.sort = ContentSort.Link;
                break;
            }
        ContentBuilder.instance.updateContent();
    }

    private buildContentTextForArticleSort(): HtmlString {
        const headerCells: HtmlString = HtmlString.buildFromTag("th", "title") // TODO use constants for the headers
                                                                               // including in the getXxxHeader methods
                                            .appendTag("th", ContentBuilder.getAuthorsHeader())
                                            .appendTag("th", "date")
                                            .appendTag("th", ContentBuilder.getUrlHeader())
                                            .appendTag("th", "language")
                                            .appendTag("th", "format")
                                            .appendTag("th", "duration")
                                            .appendTag("th", "referring page");
        const row: HtmlString = HtmlString.buildFromTag("tr", headerCells);
        for (let article of this.articles) {
            const title: HtmlString = ContentBuilder.getTitleCellFromLink(article.links[0]);
            const authors: HtmlString = ContentBuilder.getAuthorsCellFromArticle(article);
            const date: HtmlString = ContentBuilder.getDateCellFromArticle(article);
            const urls: HtmlString = ContentBuilder.getUrlCellFromArticle(article);
            const languages: HtmlString = ContentBuilder.getLanguageCellFromLink(article.links[0]);
            const formats: HtmlString = ContentBuilder.getFormatCellFromLink(article.links[0]);
            const duration: HtmlString = ContentBuilder.getDurationCellFromLink(article.links[0]);
            const referringPage: HtmlString = this.getReferringPageCellFromArticle(article);
            const cells: HtmlString = HtmlString.buildFromTag("td", title)
                                                .appendTag("td", authors)
                                                .appendTag("td", date)
                                                .appendTag("td", urls)
                                                .appendTag("td", languages)
                                                .appendTag("td", formats)
                                                .appendTag("td", duration)
                                                .appendTag("td", referringPage);
            row.appendTag("tr", cells);
        }
        const table: HtmlString = HtmlString.buildFromTag("table", row , "class", "table");
        const full: HtmlString = HtmlString.buildFromString("number of articles: " + this.articles.length)
                                           .appendString(table);
        return full;
    }

    private buildContentTextForAuthorSort(): HtmlString {
        const headerCells: HtmlString = HtmlString.buildFromTag("th", "authors")
                                            .appendTag("th", ContentBuilder.getTitleHeader())
                                            .appendTag("th", "co-authors")
                                            .appendTag("th", "date")
                                            .appendTag("th", ContentBuilder.getUrlHeader())
                                            .appendTag("th", "language")
                                            .appendTag("th", "format")
                                            .appendTag("th", "duration")
                                            .appendTag("th", "referring page");
        const row: HtmlString = HtmlString.buildFromTag("tr", headerCells);
        for (let author of this.authors) {
            let first: boolean = true;
            for (let article of author.articles) {
                const title: HtmlString = ContentBuilder.getTitleCellFromLink(article.links[0]);
                const coauthors: HtmlString = ContentBuilder.getCoauthorsCellFromArticle(article, author);
                const date: HtmlString = ContentBuilder.getDateCellFromArticle(article);
                const urls: HtmlString = ContentBuilder.getUrlCellFromArticle(article);
                const languages: HtmlString = ContentBuilder.getLanguageCellFromLink(article.links[0]);
                const formats: HtmlString = ContentBuilder.getFormatCellFromLink(article.links[0]);
                const duration: HtmlString = ContentBuilder.getDurationCellFromLink(article.links[0]);
                const referringPage: HtmlString = this.getReferringPageCellFromArticle(article);
                const cells: HtmlString = first ? HtmlString.buildFromTag("td", ContentBuilder.authorToHtmlString(author),
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
                row.appendTag("tr", cells);
                first = false;
            }
        }
        const table: HtmlString = HtmlString.buildFromTag("table", row , "class", "table");
        const full: HtmlString = HtmlString.buildFromString("number of authors: " + this.authors.length)
                                           .appendString(table);
        return full;
    }

    private buildContentTextForLinkSort(): HtmlString {
        const headerCells: HtmlString = HtmlString.buildFromTag("th", "URL")
                                           .appendTag("th", ContentBuilder.getTitleHeader())
                                           .appendTag("th", ContentBuilder.getAuthorsHeader())
                                           .appendTag("th", "date")
                                           .appendTag("th", "language")
                                           .appendTag("th", "format")
                                           .appendTag("th", "duration")
                                           .appendTag("th", "referring page");
        const row: HtmlString = HtmlString.buildFromTag("tr", headerCells);
        for (let link of this.links) {
            const url: HtmlString = ContentBuilder.getUrlCellFromLink(link);
            const title: HtmlString = ContentBuilder.getTitleCellFromLink(link);
            const authors: HtmlString = ContentBuilder.getAuthorsCellFromArticle(link.article);
            const date: HtmlString = ContentBuilder.getDateCellFromArticle(link.article);
            const languages: HtmlString = ContentBuilder.getLanguageCellFromLink(link);
            const formats: HtmlString = ContentBuilder.getFormatCellFromLink(link);
            const duration: HtmlString = ContentBuilder.getDurationCellFromLink(link);
            const referringPage: HtmlString = this.getReferringPageCellFromArticle(link.article);
            const cells: HtmlString = HtmlString.buildFromTag("td", url)
                                                .appendTag("td", title)
                                                .appendTag("td", authors)
                                                .appendTag("td", date)
                                                .appendTag("td", languages)
                                                .appendTag("td", formats)
                                                .appendTag("td", duration)
                                                .appendTag("td", referringPage);
            row.appendTag("tr", cells);
        }
        const table: HtmlString = HtmlString.buildFromTag("table", row , "class", "table");
        const full: HtmlString = HtmlString.buildFromString("number of URLs: " + this.links.length)
                                           .appendString(table);
        return full;
    }

    private static getTitleHeader(): HtmlString {
        return HtmlString.buildFromTag("a", "title",
                                       "href", "#",
                                       "onclick", "window.contentBuilderSwitchSort('" + ContentSort.Article + "')",
                                       "style", "cursor: pointer");
    }

    private static getAuthorsHeader(): HtmlString {
        return HtmlString.buildFromTag("a", "authors",
                                       "href", "#",
                                       "onclick", "window.contentBuilderSwitchSort('" + ContentSort.Author + "')",
                                       "style", "cursor: pointer");
    }

    private static getUrlHeader(): HtmlString {
        return HtmlString.buildFromTag("a", "URL",
                                       "href", "#",
                                       "onclick", "window.contentBuilderSwitchSort('" + ContentSort.Link + "')",
                                       "style", "cursor: pointer");
    }

    private static getTitleCellFromLink(link: Link): HtmlString {
        const title: HtmlString = HtmlString.buildFromString(link.title);
        if (link.subtitle !== undefined) {
            title.appendEmptyTag("br")
                .appendString(link.subtitle);
        }
        return title;
    }

    private static getAuthorsCellFromArticle(article: Article): HtmlString {
        return ContentBuilder.getCoauthorsCellFromArticle(article, undefined);
    }

    private static getCoauthorsCellFromArticle(article: Article, author: Author): HtmlString {
        const authors: HtmlString = HtmlString.buildEmpty();
        if (article.authors !== undefined) {
            let flag: boolean = false;
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

    private static getDateCellFromArticle(article: Article): HtmlString {
        const date: HtmlString = (article.date !== undefined)
                                    ? HtmlString.buildFromString(ContentBuilder.dateToHtmlString(article.date))
                                    : HtmlString.buildEmpty();
        return date;
    }

    private static getUrlCellFromArticle(article: Article): HtmlString {
        const urls: HtmlString = HtmlString.buildEmpty();
        let flag: boolean = false;
        for (let l of article.links) {
            if (flag) {
                urls.appendEmptyTag("br");
            } else {
                flag = true;
            }
            urls.appendString(ContentBuilder.getUrlCellFromLink(l));
        }
        return urls;
    }

    private static getUrlCellFromLink(link: Link): HtmlString {
        const url: HtmlString = HtmlString.buildFromTag(
            "a",
            link.url,
            "href", link.url,
            "title",
                "language: "
                + link.languages.join(" ")
                + " | format: "
                + link.formats.join(" ")
                + ((link.duration === undefined)
                    ? ""
                    : (" | duration: " + ContentBuilder.durationToString(link.duration))),
            "target", (link.url.indexOf("javascript:") === 0) ? "_self" : "_blank",
        );
        if (link.protection !== undefined) {
            url.appendString(ContentBuilder.protectionToHtmlString(link.protection));
        }
        if (link.status !== undefined) {
            url.appendString(ContentBuilder.statusToHtmlString(link.status));
        }
        return url;
}

    private static getLanguageCellFromLink(link: Link): HtmlString {
        const languages: HtmlString = HtmlString.buildEmpty();
        {
            let flag: boolean = false;
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

    private static getFormatCellFromLink(link: Link): HtmlString {
        const formats: HtmlString = HtmlString.buildEmpty();
        {
            let flag: boolean = false;
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

    private static getDurationCellFromLink(link: Link): HtmlString {
        const duration: HtmlString = (link.duration !== undefined) ? ContentBuilder.durationToHtmlString(link.duration)
                                                                   : HtmlString.buildEmpty();
        return duration;
    }

    private getReferringPageCellFromArticle(article: Article): HtmlString {
        const referringPage: HtmlString =
                HtmlString.buildFromTag(
                    "a",
                    article.page,
                    "href", "../" + article.page,
                    "title",
                        "language: "
                        + this.referringPages[article.page].languages.join()
                        + " | format: "
                        + this.referringPages[article.page].formats.join(),
                    "target", "_self",
                );
        return referringPage;
    }

    private static authorToHtmlString(author: Author): HtmlString {
        let fullString: HtmlString = HtmlString.buildEmpty();
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.namePrefix);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.firstName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.middleName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.lastName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.nameSuffix);
        return this.appendSpaceAndPostfixToHtmlString(fullString, author.givenName);
    }

    private static durationToHtmlString(duration: number[]): HtmlString {
        return HtmlString.buildFromString(ContentBuilder.durationToString(duration));
    }

    private static durationToString(duration: number[]): string {
        switch (duration.length) {
            case 3: return duration[0] + "h " + duration[1] + "m " + duration[2] + "s";
            case 2: return duration[0] + "m " + duration[1] + "s";
            case 1: return duration[0] + "s";
        }
        throw "illegal call to buildContentText.durationToString() (duration.length=" + duration.length + ")";
    }

    private static dateToHtmlString(date: number[]): HtmlString {
        switch (date.length) {
            case 3: return ContentBuilder.monthToHtmlString(date[1])
                                         .appendString(" ")
                                         .appendString(ContentBuilder.dayToHtmlString(date[2]))
                                         .appendString(", " + date[0]);
            case 2: return ContentBuilder.monthToHtmlString(date[1])
                                         .appendString(" " + date[0]);
            case 1: return HtmlString.buildFromString("" + date[0]);
        }
        throw "illegal call to buildContentText.dateToHtmlString(duration.length=" + date.length + ")";
    }

    private static dayToHtmlString(day: number): HtmlString {
        switch (day) {
            case  1: return HtmlString.buildFromString("1").appendTag("sup", "st");
            case 21: return HtmlString.buildFromString("21").appendTag("sup", "st");
            case 31: return HtmlString.buildFromString("31").appendTag("sup", "st");
            case  2: return HtmlString.buildFromString("2").appendTag("sup", "nd");
            case 22: return HtmlString.buildFromString("22").appendTag("sup", "nd");
            case  3: return HtmlString.buildFromString("3").appendTag("sup", "rd");
            case 23: return HtmlString.buildFromString("23").appendTag("sup", "rd");
            default: return HtmlString.buildFromString("" + day).appendTag("sup", "th");
        }
    }

    private static monthToHtmlString(month: number): HtmlString {
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

    private static appendSpaceAndPostfixToHtmlString(str: HtmlString, postfix: string|undefined): HtmlString {
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

    private static protectionToHtmlString(protection: string): HtmlString {
        if (protection === "free_registration") {
            return HtmlString.buildFromTag(
                "span",
                "\u{1f193}",
                "title", "free registration required",
            );
        }
        if (protection === "payed_registration") {
            return HtmlString.buildFromTag(
                "span",
                "\u{1f4b0}",
                "title", "payed registration required",
            );
        }
        throw "illegal call to buildContentText.protectionToHtmlString() (unknown value = \"" + protection + "\")";
    }

    private static statusToHtmlString(protection: string): HtmlString {
        if ((protection === "dead") || (protection === "zombie")) {
            return HtmlString.buildFromTag(
                "span",
                "\u{2020}",
                "title", "dead link",
            );
        }
        throw "illegal call to buildContentText.statusToHtmlString() (unknown value = \"" + protection + "\")";
    }
}

(<any>window).contentBuilderSwitchSort = (sort: string) => {
    ContentBuilder.prototype.switchSort(sort);
};

// ---------------------------------------------------------------------------------------------------------------

export class MapBuilder {

    private divCounter: number = 0;
    private static openedNodeSymbol: string = "\u25BC";
    private static closedNodeSymbol: string = "\u25BA";
    private static spanDivName: string = "spanDiv";
    private static toggleDivName: string = "toggleDiv";

    // constructor() {
    // }

    private buildMap(): void  {
        const mapRequest = new XMLHttpRequest();
        const that: MapBuilder = this;
        mapRequest.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                const myObj: any = JSON.parse(this.responseText);
                let page: string = null;
                if (window.location.search.indexOf("?page=") === 0) {
                    page = window.location.search.substring(6);
                }
                that.initNodeOpenStatus(myObj.root, page);
                document.getElementById("content").innerHTML = that.buildNodeText(myObj.root, 0, page).getHtml();
            }
        };
        mapRequest.open("GET", "../content/map.json");
        mapRequest.send();
    }

    public handleNodeClick(index: number): boolean {
        if ($("#" + MapBuilder.spanDivName + index).is(":visible")) {
            MapBuilder.hideNode(index);
        } else {
            MapBuilder.showNode(index);
        }
        return(false);
    }

    private static hideNode(index: number) {
        $("#" + MapBuilder.spanDivName + index).hide();
        document.getElementById(MapBuilder.toggleDivName + index).innerHTML = MapBuilder.closedNodeSymbol;
    }

    private static showNode(index: number) {
        $("#" + MapBuilder.spanDivName + index).show();
        document.getElementById(MapBuilder.toggleDivName + index).innerHTML = MapBuilder.openedNodeSymbol;
    }

    private initNodeOpenStatus(node: MapNode, page: string): boolean {
        let oneChildIsOpen: boolean = false;
        if (node.children !== undefined) {
            for (let child of node.children) {
                oneChildIsOpen = oneChildIsOpen || this.initNodeOpenStatus(child, page);
            }
        }
        if (node.page === page) {
            node.open = true;
        } else {
            node.open = oneChildIsOpen;
        }
        return node.open;
    }

    private buildNodeText(node: MapNode, depth: number, page: string): HtmlString {
        const str: HtmlString = HtmlString.buildEmpty();
        for (let i = 0; i < depth; i++) {
            str.appendString("\u00A0\u00A0\u00A0\u00A0");
        }
        if (node.page === undefined) {
            str.appendString(node.title);
        } else {
            str.appendTag("a", node.title,
                          "href", "../" + node.page,
                          "title", "language: " + node.languages.join() + " | format: " + node.formats.join(),
                          "target", "_self",
                          "style", (node.page === page ? "font-weight: bold" : ""));
        }
        if (node.children === undefined) {
            str.appendEmptyTag("br");
        } else {
            const counter = this.divCounter;
            this.divCounter++;
            str.appendTag("a", node.open ? MapBuilder.openedNodeSymbol : MapBuilder.closedNodeSymbol,
                          "onclick", "window.handleMapNodeClick(" + counter + ")",
                          "id", MapBuilder.toggleDivName + counter,
                          "style", "cursor: pointer");
            str.appendEmptyTag("br");
            const childStr: HtmlString = HtmlString.buildEmpty();
            for (let child of node.children) {
                childStr.appendString(this.buildNodeText(child, depth + 1, page));
            }
            str.appendTag("span", childStr,
                          "id", MapBuilder.spanDivName + counter,
                          "style", "display: " + (node.open ? "initial" : "none"));
        }
        return str;
    }
}

(<any>window).handleMapNodeClick = (index: number) => {
    MapBuilder.prototype.handleNodeClick(index);
};

// ---------------------------------------------------------------------------------------------------------------

function escapeHtml(unsafe: string): string {
    return unsafe.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
 }

 // ---------------------------------------------------------------------------------------------------------------

 (<any>window).create_index = () => {
    let letters: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let w: number = 100.0 / letters.length;
    let str: string = '<table id="navigationBar" width="100%"><TR>';
    for (let i: number = 0; i < letters.length; i++ ) {
        str += '<td align="center" width="'
               + w
               + '%"><a href="#'
               + letters.charAt(i)
               + '">'
               + letters.charAt(i)
               + "</a></td>";
    }
  str += "<tr></table>";
  $("body").prepend(str);
};

// ---------------------------------------------------------------------------------------------------------------

(<any>window).do_email = () => {
    window.location.href = "mailto:"
                           + "lmazure.website%40gmail.com"
                           + "?subject="
                           + encodeURIComponent("about the '"
                               + document.title
                               + "' page");
};

// ---------------------------------------------------------------------------------------------------------------

(<any>window).display_search = () => {
    $("#searchPanel").slideToggle({
        done: function() {
            if ($("#searchPanel").is(":visible")) {
                $("#searchPanel>#panel>#text").focus();
            }
        },
        progress: function() {
            scrollTo(0, document.body.scrollHeight);
        },
    });
};

// ---------------------------------------------------------------------------------------------------------------

(<any>window).do_search = () => {
  let request: string = "http://www.google.com/search?as_sitesearch=mazure.fr&q=";
  const terms: string[] = (<string>($("#searchPanel>#panel>#text").val())).split(" ");
  for (let i: number = 0; i < terms.length; i++) {
    if (terms[i] !== "") { // to avoid additional space characters
      if (i > 0) {
          request += "+";
      }
      request += terms[i];
    }
  }
  open(request, "_blank");
};

// ---------------------------------------------------------------------------------------------------------------

// rfc/<rfc-number>
// man/linux/<man-section-number>/<command>
// man/macosx/<man-section-number>/<command>
// man/x11/<man-section-number>/<command>
// j2se/<class>
// j2se/<class>/<method>
// clearcase/command

(<any>window).do_reference = (str: string) => {
    const a: string[] = str.split("/");
    let url: string = "?";
    if ( a[0] === "rfc" ) {
        url = "http://www.ietf.org/rfc/rfc" + a[1] + ".txt";
    } else if ( a[0] === "man" && a[1] === "linux" ) {
        url = "http://man7.org/linux/man-pages/man" + a[2].substr(0, 1) + "/" + a[3] + "." + a[2] + ".html";
    } else if ( a[0] === "man" && a[1] === "macosx" ) {
        url = "https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man"
          + a[2]
          + "/"
          + a[3]
          + "."
          + a[2]
          + ".html";
    } else if ( a[0] === "man" && a[1] === "x11" ) {
        url = "http://www.x.org/X11R6.8.2/doc/" + a[3] + "." + a[2] + ".html";
    } else if ( a[0] === "j2se" && a.length === 2 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g, "/") + ".html";
    } else if ( a[0] === "j2se" && a.length === 3 ) {
        url = "http://java.sun.com/j2se/1.5.0/docs/api/" + a[1].replace(/\./g, "/") + ".html#" + escapeHtml(a[2]);
    } else if ( a[0] === "clearcase" && a.length === 2 ) {
        url = "http://www.agsrhichome.bnl.gov/Controls/doc/ClearCaseEnv/v4.0doc/cpf_4.0/ccase_ux/ccref/"
        + a[1]
        + ".html";
    }
    window.open(url, "_blank");
};

// ---------------------------------------------------------------------------------------------------------------

declare function postInitialize(): void;

(<any>window).onload = () => {
    const currdate: any = new Date();

    /* tslint:disable:no-string-literal */
    /* tslint:disable:semicolon */
    /* tslint:disable:no-unused-expression */
    // This code is from Google, so let's not modify it too much
    (function(i, s, o, g, r, a, m) {
        i["GoogleAnalyticsObject"] = r;
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * currdate;
        a = s.createElement(o), m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m)
        })(window, document, "script", "//www.google-analytics.com/analytics.js", "ga");
    /* tslint:enable:no-unused-expression */
    /* tslint:enable:semicolon */
    /* tslint:enable:no-string-literal */

  ga("create", "UA-45789787-1", "auto");
  ga("send", "pageview");

  if (typeof postInitialize === "function") {
    postInitialize();
  }
};

// ---------------------------------------------------------------------------------------------------------------

let personPopup:HTMLElement = null;

(<any>window).do_person = (namePrefix:string, firstName: string, middleName: string, lastName: string, nameSuffix:string, givenName: string) => {

    // TODO get position of the mouse click
    // TODO place the popup at the mouse click position
    if (personPopup === null) {
        personPopup= document.createElement("div");
        personPopup.classList.add("personPopup");
        document.getElementById("footer").insertAdjacentElement("afterend", personPopup);
    }

    const description:string = "namePrefix=" + namePrefix
    + "\nfirstName=" + firstName
    + "\nmiddleName=" + middleName
    + "\nlastName=" + lastName
    + "\nnameSuffix=" + nameSuffix
    + "\ngivenName=" + givenName;
  const desc:HtmlString = HtmlString.buildFromTag("div", description);
  personPopup.style.top = "10px";
  personPopup.style.left = "100px";
  personPopup.innerHTML = desc.getHtml();
};

