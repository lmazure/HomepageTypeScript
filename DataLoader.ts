export interface Author {
    namePrefix: string;
    firstName: string;
    middleName: string;
    lastName: string;
    nameSuffix: string;
    givenName: string;
    articles: Article[]|undefined;
    links: Link[]|undefined;
}

export interface Link {
    url: string;
    title: string;
    subtitle: string[];
    duration: number;
    formats: string[];
    languages: string[];
    status: string;
    protection: string;
    article: Article|undefined;
}

export interface Article {
    links: Link[];
    date: number;
    authorIndexes: number[];
    authors: Author[]|undefined;
    page: string;
}

export interface Keyword {
    id: String;
    links: Link[];
    articleIndexes: number[];
    articles: Article[]|undefined;
}

export interface MapNode {
    title: string;
    page: string;
    languages: string[];
    formats: string[];
    children: MapNode[];
    open: boolean|undefined;
}

export class DataLoader {

    private authors: Author[];
    private articles: Article[];
    private links: Link[];
    private keywords: Keyword[];
    private referringPages: MapNode[];

    constructor(callback: (authors: Author[], articles: Article[], links: Link[], referringPages: MapNode[], keywords: Keyword[]) => void) {
        let mapRoot: MapNode;
        const p1: Promise<any> = DataLoader.getJson("../content/author.json")
                                           .then((data: { authors: Author[]; }) => { this.authors = data.authors; })
                                           .catch((error) => console.log("Failed to load author.json", error));
        const p2: Promise<any> = DataLoader.getJson("../content/article.json")
                                           .then((data: { articles: Article[]; }) => { this.articles = data.articles; })
                                           .catch((error) => console.log("Failed to load article.json", error));
        const p3: Promise<any> = DataLoader.getJson("../content/map.json")
                                           .then((data: { root: MapNode; }) => { mapRoot = data.root; })
                                           .catch((error) => console.log("Failed to load map.json", error));
        const p4: Promise<any> = DataLoader.getJson("../content/keyword.json")
                                           .then((data: { keywords: Keyword[]; }) => { this.keywords = data.keywords; })
                                           .catch((error) => console.log("Failed to load keyword.json", error));
        const promises: Promise<any>[] = [p1, p2, p3, p4];
        Promise.all(promises)
               .then(() => this.postprocessData(mapRoot))
               .then(() => callback(this.authors, this.articles, this.links, this.referringPages, this.keywords))
               .catch((error) => console.log("Failed to process data", error));
    }

    private static getJson(url: string): any {
        return new Promise(function(resolve, reject) {
          const request = new XMLHttpRequest();
          request.onload = function() {
            if (this.status === 200) {
                resolve(JSON.parse(this.responseText));
            } else {
                reject(Error(request.statusText));
            }
          };
          request.onerror = function() {
            reject(Error("Network Error"));
          };
          request.open("GET", url);
          request.send();
        });
    }

    private postprocessData(rootNode: MapNode): void {
        this.links = [];
        for (let article of this.articles) {
            if (article.authorIndexes !== undefined) {
                article.authors = article.authorIndexes.map(i => this.authors[i]);
                // TODO delete article.authorIndexes
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
            author.articles.sort(DataLoader.compareArticleByDate);
        }
        this.links.sort(function(l1: Link, l2: Link): number {
            const u1: string = l1.url.substring(l1.url.indexOf("://") + 1);
            const u2: string = l2.url.substring(l2.url.indexOf("://") + 1);
            return u1.localeCompare(u2, "en-GB");
        });
        this.referringPages = [];
        this.postProcessData_InserReferingPage(rootNode);
        for (let keyword of this.keywords) {
            keyword.articles = keyword.articleIndexes.map(i => this.articles[i]);
            // TODO delete keyword.articleIndexes
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

    private getAuthor(author: Author): Author {

        for (let a of this.authors) {
            if ((a.namePrefix === author.namePrefix) &&
                (a.firstName === author.firstName) &&
                (a.middleName === author.middleName) &&
                (a.lastName === author.lastName) &&
                (a.nameSuffix === author.nameSuffix) &&
                (a.givenName === author.givenName)) {
                return a;
                }
        }

        return null;
    }

    private static compareArticleByDate(article1: Article, article2: Article): number {
        if (article1.date === undefined) {
            if (article2.date === undefined) {
                return article1.links[0].title.localeCompare(article2.links[0].title, "en-GB");
            } else {
                return -1;
            }
        } else {
            if (article2.date === undefined) {
                return 1;
            } else {
                const str1: string = (article1.date.toString() + "0000").slice(0, 8);
                const str2: string = (article2.date.toString() + "0000").slice(0, 8);
                const diff: number = str1.localeCompare(str2, "en-GB");
                if (diff !== 0) {
                    return diff;
                }
                return article1.links[0].title.localeCompare(article2.links[0].title, "en-GB");
            }
        }
    }
}
