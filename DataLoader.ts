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
    subtitle: string;
    duration: number[];
    formats: string[];
    languages: string[];
    status: string;
    protection: string;
    article: Article|undefined;
}

export interface Article {
    links: Link[];
    date: number[];
    authorIndexes: number[];
    authors: Author[]|undefined;
    page: string;
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
    private referringPages: MapNode[];

    constructor(callback: (authors: Author[], articles: Article[], links: Link[], referringPages: MapNode[]) => void) {
        let mapRoot: MapNode;
        let adBook: any;
        const p1: Promise<any> = DataLoader.getJson("../content/author.json")
                                           .then((data: { authors: Author[]; }) => { this.authors = data.authors; })
                                           .catch((error) => console.log("Failed to load author.json", error));
        const p2: Promise<any> = DataLoader.getJson("../content/article.json")
                                           .then((data: { articles: Article[]; }) => { this.articles = data.articles; })
                                           .catch((error) => console.log("Failed to load article.json", error));
        const p3: Promise<any> = DataLoader.getJson("../content/map.json")
                                           .then((data: { root: MapNode; }) => { mapRoot = data.root; })
                                           .catch((error) => console.log("Failed to load map.json", error));
        const p4: Promise<any> = DataLoader.getJson("../content/adbook.json")
                                           .then((data: { adbook: any; }) => { adBook = data.adbook; })
                                           .catch((error) => console.log("Failed to load adbook.json", error));
        const promises: Promise<any>[] = [p1, p2, p3, p4];
        Promise.all(promises)
               .then(() => this.postprocessData(mapRoot, adBook))
               .then(() => callback(this.authors, this.articles, this.links, this.referringPages))
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

    private postprocessData(rootNode: MapNode, adBook: any): void {
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
            author.articles.sort(DataLoader.compareArticleByDate);
        }
        this.links.sort(function(l1: Link, l2: Link): number {
            const u1: string = l1.url.substring(l1.url.indexOf("://") + 1);
            const u2: string = l2.url.substring(l2.url.indexOf("://") + 1);
            return u1.localeCompare(u2);
        });
        this.referringPages = [];
        this.postProcessData_InserReferingPage(rootNode);
        for (let record of adBook) {
            const author = this.getAuthor(record.author);
            if (author !== null) {
                author.links = record.links;
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
}
