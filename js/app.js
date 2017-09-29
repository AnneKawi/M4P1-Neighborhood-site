var Cat1 = {
    name: 'Kitty',
    picURL: "img/22252709_010df3379e_z.jpg",
    nickNames: ['Penny', 'Tiger', 'CAT'],
    clicks: 0,
    };
var Cat2 = {
    name: 'Merry',
    picURL: "img/cat-1192026_960_720.jpg",
    nickNames: ['Funnycat'],
    clicks: 0,
    };
var Cat3 = {
    name: 'Bella',
    picURL: "img/cat-323262__340.jpg",
    nickNames: ['Belle'],
    clicks: 0,
    };
var Cat4 = {
    name: 'Cherry',
    picURL: "img/cat-2083492__340.jpg",
    nickNames: ['Kirsche'],
    clicks: 0,
    };
var Cat5 = {
    name: 'Sleepy',
    picURL: "img/cat-1634369__340.jpg",
    nickNames: ['Zzzzz'],
    clicks: 0,
    };

var initialCats = [Cat1, Cat2, Cat3, Cat4, Cat5];

//KnockoutJS-Bereich mit der Einzelkatze und dem View-Model zum Data-Handling
var Cat = function(data) {
    this.clickCount = ko.observable(data.clicks);
    this.name = ko.observable(data.name);
    this.nickNames = ko.observableArray(data.nickNames);
    this.imgSrc = ko.observable(data.picURL);

    this.catLevel = ko.computed(function() {
            if (this.clickCount() < 4) {
                return 'Newborn';
            } else if (this.clickCount() < 10) {
                return 'Kitten';
            } else if (this.clickCount() >= 10) {
                return 'Cat';
            };
        }, this);

};

var ViewModel = function() {
    var self = this; //pointer zum viewModel, selbst wenn man im HTMl den this-context mit "with: ... " ändert (Bsp: with:currentCat => this ist dann innerhalb der currentCat(), was arg verwirrend werden kann)

    self.catList = ko.observableArray([]); // würde ich direkt das initialCats-Array reingeben, hätte ich nur einfache Objekte aber keine ko.observables,

    initialCats.forEach(function(catItem) { // => daher alle erst mal als Cat() implementieren und dann ab ins array (und immer schön aufpassen, den self-pointer zu nutzen um im Original-View-Model zu bleiben)
        self.catList.push(new Cat(catItem));
    });

    self.currentCat = ko.observable(self.catList()[0]);

    self.setCurrentCat = function(clickedCat) {
        self.currentCat(clickedCat);
        };

    self.incrementCounter = function() {
        self.currentCat().clickCount(self.currentCat().clickCount() + 1);
        };

};

ko.applyBindings(new ViewModel()) // hiermit werden die data-binds im HTML mit dem ViewModel verbunden und KnockoutJS kümmert sich jetzt um die Aktualisierung der Anzeige
