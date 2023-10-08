import { HtmlString } from "./HtmlString.js";
import { Author, Link, Article, MapNode, DataLoader } from "./DataLoader.js";


enum ContentSort {
    Article = "article",
    Author= "author",
    Link = "link",
}

export class ContentBuilder {

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
        const loader: DataLoader = new DataLoader( (authors, articles, links, referringPages) => {
            this.authors = authors;
            this.articles = articles;
            this.links = links;
            this.referringPages = referringPages;
            this.updateContent();
        });
    }

    private updateContent(): void {
        document.getElementById("content").innerHTML = this.buildContentText().getHtml();
        this.setGoToMapHref();
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
            title.appendString(" \u{2014} ")
                 .appendString(link.subtitle.join(" \u{2014} "));
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
        return this.getTitleOrUrlFromLink(link, false);
    }

    private static getTitleOrUrlFromLink(link: Link, displayTitleInsteadOfUrl: boolean): HtmlString {
        const url: HtmlString = HtmlString.buildFromTag(
            "a",
            displayTitleInsteadOfUrl ? link.title + ((link.subtitle !== undefined) ? (" — " + link.subtitle) : "")
                                     : link.url,
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

    public static authorToHtmlString(author: Author): HtmlString {
        let fullString: HtmlString = HtmlString.buildEmpty();
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.namePrefix);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.firstName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.middleName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.lastName);
        fullString = this.appendSpaceAndPostfixToHtmlString(fullString, author.nameSuffix);
        return this.appendSpaceAndPostfixToHtmlString(fullString, author.givenName);
    }

    public static linkToHtmlString(link: Link): HtmlString {
        return ContentBuilder.getTitleOrUrlFromLink(link, true);
    }

    private static durationToHtmlString(duration: number): HtmlString {
        return HtmlString.buildFromString(ContentBuilder.durationToString(duration));
    }

    private static durationToString(duration: number): string {
        if ((duration <= 0) || (duration >= 24*60*60)) {
            throw "illegal call to buildContentText.dateToHtmlString() (duration = " + duration + ")";
        }
        let hours: number = Math.floor(duration / 3600);
        let minutes: number = Math.floor((duration % 3600) / 60);
        let seconds: number = duration % 60;
        return ((hours > 0 ) ? (hours + "h ") : "")
            + (((hours > 0 ) || (minutes > 0 )) ? (minutes + "m ") : "")
            + seconds + "s";
    }

    private static dateToHtmlString(date: number): HtmlString {
        if (date <= 9999) {
            return HtmlString.buildFromString("" + date);
        } else if (date <= 999999) {
            let year: number = Math.floor(date / 100);
            let month: number = date % 100;
            return ContentBuilder.monthToHtmlString(month)
                                 .appendString(" " + year);
        } else if (date <= 99999999) {
            let year: number = Math.floor(date / 10000);
            let month: number = Math.floor((date % 10000) / 100);
            let day: number = date % 100;
            return ContentBuilder.monthToHtmlString(month)
                                 .appendString(" ")
                                 .appendString(ContentBuilder.dayToHtmlString(day))
                                 .appendString(", " + year);
        }
        throw "illegal call to buildContentText.dateToHtmlString() (date = " + date + ")";
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
        throw "illegal call to buildContentText.monthToHtmlString() (month = " + month + ")";
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

    private static statusToHtmlString(status: string): HtmlString {
        if ((status === "dead") || (status === "zombie")) {
            return HtmlString.buildFromTag(
                "span",
                "\u{2020}",
                "title", "dead link",
            );
        } else if (status === "obsolete") {
            return HtmlString.buildFromTag(
                "span",
                "\u{2021}",
                "title", "obsolete",
            );
        } else if (status === "removed") {
            return HtmlString.buildFromTag(
                "span",
                "\u{1FAA6}",
                "title", "obsolete",
            );
        }
        throw "illegal call to buildContentText.statusToHtmlString() (unknown value = \"" + status + "\")";
    }
}

(<any>window).contentBuilderSwitchSort = (sort: string) => {
    ContentBuilder.prototype.switchSort(sort);
};
