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