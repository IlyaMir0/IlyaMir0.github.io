let myMap;
let myPlacemark;
let map_1 = document.getElementById('map_1')
let map_2 = document.getElementById('map_2')
let mapId = window.innerWidth > 860 ? map_2 : map_1;
ymaps.ready(function () {
    myMap = new ymaps.Map(mapId, {
        center: [59.97, 30.32],
        zoom: 15,
        controls: [],
    },

        {
            searchControlProvider: 'yandex#search',
            suppressMapOpenBlock: true
        }),


        myMap.controls.remove('zoomControl');
    var marker = new ymaps.Placemark([55.75, 37.57], {
        balloonContent: 'Метка'
    });

    myMap.geoObjects.add(marker);
    var cross = new ymaps.Placemark([55.75, 37.57], {
        iconLayout: 'default#cross',
        iconShape: {
            type: 'Rectangle',
            coordinates: [
                [-15, -15], [15, 15]
            ]
        }
    });

    myMap.geoObjects.add(cross);
    myMap.events.add('boundschange', function (event) {
        cross.geometry.setCoordinates(event.get('newCenter'));
    });
    myPlacemark = new ymaps.Placemark(myMap.getCenter(), {
        hintContent: 'Собственный значок метки',
        balloonContent: 'Это красивая метка',
        preset: 'islands#redDotIcon',
    },

        {
            iconLayout: 'default#image',
            iconImageHref: './assets/icons/Pin.png',
            iconImageSize: [30, 42],
        }),
        myMap.geoObjects.add(myPlacemark);
});

async function getCoordinates(address) {
    let response = await fetch(`https://geocode-maps.yandex.ru/1.x?apikey=5b7a2a61-13a4-4159-a6aa-02e5d7932fe0&format=json&geocode=${address}&results=1`, {
        method: 'GET'
    })
    /*     return [{
            GeoObject: {
                Point: {
                    pos: '32.921574 45.573856'
                }
            }
        }] */
    let data = await response.text();
    let parsed = JSON.parse(data);
    return parsed.response.GeoObjectCollection.featureMember;
}

const throttleRequest = throttle(handler, 1000);

document.querySelector('.js-address').addEventListener('input', async (event) => {
    const value = event.target.value;
    if (value.length > 2) {
        throttleRequest(value);
    }
});



async function handler(address) {
    const coordinates = await getCoordinates(address);
    myMap.setCenter(coordinates[0].GeoObject.Point.pos.split(' ').map(e => +e).reverse());
    console.log(coordinates[0].GeoObject.Point.pos.split(' '))

}

function throttle(func, ms) {
    let isThrottled = false,
        savedArgs,
        savedThis;

    function wrapper() {

        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }

        func.apply(this, arguments);

        isThrottled = true;

        setTimeout(function () {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, ms);
    }

    return wrapper;
}

class Cart {
    constructor() {
        this.initUI();
        this.products = [];
        this.promos = [500];
        this.deliveryPrice = 200;
    }

    initUI() {
        this.UI = {
            declination: document.querySelector('.js-declination'),
            price: document.querySelector('.js-price'),
            discount: document.querySelector('.js-discount'),
            share: document.querySelector('.js-share'),
            promo: document.querySelector('.js-promo'),
            priceResult: document.querySelector('.js-price-result'),
            productCount: document.querySelector('.js-product-count'),
            titlePrice: document.querySelector('.js-title-price'),
        }
    }

    get titlePrice() {
        return this.price - this.share;
    }

    get productCount() {
        return this.currentProducts.length;
    }

    get currentProducts() {
        return this.products.filter(product => !product.isRemoved);
    }

    get price() {
        return this.currentProducts.reduce((price, product) => price + product.priceOldResult, 0);
    }

    get share() {
        return this.price - this.currentProducts.reduce((price, product) => price + product.priceNewResult, 0);
    }

    get promoResult() {
        return this.promos.reduce((result, promo) => result + promo, 0)
    }

    get discount() {
        return this.promoResult + this.share;
    }

    get priceResult() {
        return this.price - this.discount + this.deliveryPrice;
    }

    addProduct(product) {
        this.products.push(product);
        product.listen((product) => this.update(product));
        this.updateUI();
    }

    update(product) {
        if (product.isDecline) {
            this.products = this.products.filter(p => p != product);
        }

        this.updateUI();
    }

    updateUI() {
        this.UI.titlePrice.innerText = formatter(this.titlePrice);
        this.UI.productCount.innerText = formatter(this.productCount);
        this.UI.price.innerText = formatter(this.price);
        this.UI.discount.innerText = formatter(this.discount);
        this.UI.share.innerText = formatter(this.share);
        this.UI.promo.innerText = formatter(this.promoResult);
        this.UI.priceResult.innerText = formatter(this.priceResult);
        this.UI.declination.innerText = declOfNum(this.productCount, ['товар', 'товара', 'товаров']);
    }

    addPromocode(code) {
        this.promos.push(code);
        this.updateUI();
    }

    addDeliveryPrice(price) {
        this.deliveryPrice = price;
        this.updateUI();
    }
}

class Product {
    constructor(card) {
        this.initUI(card);
        this.listeners = [];

        if (this.UI.priceOld) {
            this.priceOld = +this.UI.priceOld.innerText.replace(' ', '');
        }

        else {
            this.priceOld = +this.UI.priceNew.innerText.replace(' ', '')
        }

        this.priceNew = +this.UI.priceNew.innerText.replace(' ', '');
        this.count = +this.UI.count.innerText;

        this.isRemoved = false;
        this.isDecline = false;
    }

    initUI(card) {
        this.UI = {
            card: card,
            priceOld: card.querySelector('.js-price-old'),
            priceNew: card.querySelector('.js-price-new'),

            removeButton: card.querySelector('.js-remove'),
            recoveryButton: card.querySelector('.js-recovery'),


            body: card.querySelector('.js-body'),
            banner: card.querySelector('.js-banner'),

            priceOldResult: card.querySelector('.js-price-old-result'),
            priceNewResult: card.querySelector('.js-price-new-result'),

            count: card.querySelector('.js-count'),
            countMinus: card.querySelector('.js-minus'),
            countPlus: card.querySelector('.js-plus'),
            
            decline: card.querySelector('.js-decline'),
            removebuttonMobile: card.querySelector('.js-remove_mobile'),
        }
        
        this.UI.countMinus.addEventListener('click', () => this.onCountMinusClick());
        this.UI.countPlus.addEventListener('click', () => this.onCountPlusClick());
        this.UI.removeButton.addEventListener('click', () => this.onRemoveButtonClick());
        this.UI.recoveryButton.addEventListener('click', () => this.onRecoveryButtonClick());
        this.UI.decline.addEventListener('click', () => this.onDeclineButtonClick());
        this.UI.removebuttonMobile.addEventListener('click', () => this.onMobileButtonClick());
    }

    onDeclineButtonClick() {
        this.isDecline = true;
        this.UI.card.remove();
        this.notify();
    }

    get priceOldResult() {
        return this.priceOld * this.count;
    }

    get priceNewResult() {
        return this.priceNew * this.count;
    }

    onRemoveButtonClick() {
        this.isRemoved = true;
        this.updateCardUI();
    }

    onMobileButtonClick() {
        this.isRemoved = true;
        this.updateCardUI();
    }

    onRecoveryButtonClick() {
        this.isRemoved = false;
        this.updateCardUI();
    }

    onCountMinusClick() {
        const newCount = this.count - 1;
        if (newCount <= 0) {
            this.isRemoved = true;
        } else {
            this.count = newCount;
        }
        this.updateCardUI();
    }

    onCountPlusClick() {
        const newCount = +this.count + 1;
        this.count = newCount;
        this.updateCardUI();
    }

    updateCardUI() {
        this.UI.count.innerHTML = this.count;
        this.UI.priceNewResult.innerText = formatter(this.priceNewResult);
        if (this.UI.priceOldResult) {
            this.UI.priceOldResult.innerText = formatter(this.priceOldResult);
        }

        if (this.isRemoved) {
            this.UI.body.style.display = 'none';
            this.UI.banner.style.display = 'block';
        } else {
            this.UI.body.style.display = 'grid';
            this.UI.banner.style.display = 'none';
        }
        this.notify();
    }

    notify() {
        this.listeners.forEach((listener) => listener(this));
    }

    listen(listener) {
        this.listeners.push(listener);
    }
}

const cart = new Cart();
const cards = document.querySelectorAll('.js-card');
cards.forEach((card) => initCard(card));

function initCard(card) {
    cart.addProduct(new Product(card));
}

function formatter(number) {
    return number.toLocaleString();
}

function declOfNum(productCount, text_forms) {
    productCount = Math.abs(productCount) % 100;
    var n1 = productCount % 10;
    if (productCount > 10 && productCount < 20) { return text_forms[2]; }
    if (n1 > 1 && n1 < 5) { return text_forms[1]; }
    if (n1 == 1) { return text_forms[0]; }
    return text_forms[2];
}

const textarea = document.querySelector(".js-comment");
const count = document.querySelector(".js-symbols");

function countLetters() {
    const text = textarea.length;
    const textlength = textarea.value.length;
    count.innerText = `${textlength}`;
}

textarea.oninput = function () {
    this.value = this.value.substr(0, 142)
}

let form = document.querySelector('.js-form');
let input = document.querySelector('.input');
/* let inputstyle = input.style; */

form.addEventListener('submit', function (event) {
    event.preventDefault();
    let error = form.querySelectorAll('.error')
    for (let i = 0; i < error.length; i++) {
        error[i].remove();
    }
    let correct = form.querySelectorAll('.correct')
    for (let i = 0; i < correct.length; i++) {
        correct[i].remove();
    }

    let fieldValue = document.forms["form"]["input"].value;
    if (fieldValue == "") {
        event.preventDefault();
        input.classList.add('errorFocus')
        input.classList.remove('correctFocus')
        form.insertAdjacentHTML('beforeend', `<div class="error">
        Заполните поле</div>`)
    }
    if (fieldValue == "1B6D9FC") {
        event.preventDefault();
        input.classList.remove('errorFocus')
        input.classList.add('correctFocus')
        form.insertAdjacentHTML('beforeend', `<div class="correct">
        1B6D9FC - Промокод применен</div>`)

    }
    if (fieldValue != "1B6D9FC" && !fieldValue == 0) {
        event.preventDefault();
        input.classList.add('errorFocus')
        input.classList.remove('correctFocus')
        form.insertAdjacentHTML('beforeend', `<div class = "error"> Купон не найден</div>`)
    }
})

let formName = document.querySelector('.js-form_name');
let inputName = document.querySelector('.input_name');

inputName.addEventListener("keyup", function () {
    inputName.value = this.value.replace(/[\d]/g, "");
})

formName.addEventListener('submit', function (event) {
    event.preventDefault();
    let error = formName.querySelectorAll('.error')
    for (let i = 0; i < error.length; i++) {
        error[i].remove();
    }
    let correct = formName.querySelectorAll('.correct')
    for (let i = 0; i < correct.length; i++) {
        correct[i].remove();
    }

    let fieldValue = document.forms["form_name"]["input_name"].value;
    function validateName(fieldValue) {
        var pattern = /^[А-Я][а-яА-Я\s-]+$/;
        return pattern.test(fieldValue);
    }

    if (fieldValue == "") {
        event.preventDefault();
        inputName.classList.add('errorFocus')
        inputName.classList.remove('correctFocus')
        formName.insertAdjacentHTML('beforeend', `<div class="error">
        Заполните поле</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (validateName(fieldValue)) {
        event.preventDefault();
        inputName.classList.remove('errorFocus')
        inputName.classList.add('correctFocus')
        formName.insertAdjacentHTML('beforeend', `<div class="correct">
        Имя введено корректно</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (!validateName(fieldValue) && !fieldValue == 0) {
        event.preventDefault();
        inputName.classList.add('errorFocus')
        inputName.classList.remove('correctFocus')
        formName.insertAdjacentHTML('beforeend', `<div class = "error"> Введите корректное имя</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
})

let formSecondName = document.querySelector('.js-form_secondName');
let inputSecondName = document.querySelector('.input_secondName');

inputSecondName.addEventListener("keyup", function () {
    inputSecondName.value = this.value.replace(/[\d]/g, "");
})

formSecondName.addEventListener('submit', function (event) {
    event.preventDefault();
    let error = formSecondName.querySelectorAll('.error')
    for (let i = 0; i < error.length; i++) {
        error[i].remove();
    }
    let correct = formSecondName.querySelectorAll('.correct')
    for (let i = 0; i < correct.length; i++) {
        correct[i].remove();
    }

    let fieldValue = document.forms["form_secondName"]["input_secondName"].value;

    function validateName(fieldValue) {
        var pattern = /^[А-Я][а-яА-Я\s-]+$/;
        return pattern.test(fieldValue);
    }

    if (fieldValue == "") {
        event.preventDefault();
        inputSecondName.classList.add('errorFocus')
        inputSecondName.classList.remove('correctFocus')
        formSecondName.insertAdjacentHTML('beforeend', `<div class="error">
        Заполните поле</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (validateName(fieldValue)) {
        event.preventDefault();
        inputSecondName.classList.remove('errorFocus')
        inputSecondName.classList.add('correctFocus')
        formSecondName.insertAdjacentHTML('beforeend', `<div class="correct">
        Фамилия введена корректно</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (!validateName(fieldValue) && !fieldValue == 0) {
        event.preventDefault();
        inputSecondName.classList.add('errorFocus')
        inputSecondName.classList.remove('correctFocus')
        formSecondName.insertAdjacentHTML('beforeend', `<div class = "error"> Введите корректную фамилию</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
})

let formNumber = document.querySelector('.js-form_number');
let inputNumber = document.querySelector('.input_number');

inputNumber.addEventListener("keyup", function () {
    inputNumber.value = this.value.replace(/[^+][^\d]/g, "");
})

inputNumber.addEventListener("focus", function () {
    if (inputNumber.value.length === 0) {
        inputNumber.value = "+7";
    }
});

formNumber.addEventListener('submit', function (event) {
    event.preventDefault();
    let error = formNumber.querySelectorAll('.error')
    for (let i = 0; i < error.length; i++) {
        error[i].remove();
    }
    let correct = formNumber.querySelectorAll('.correct')
    for (let i = 0; i < correct.length; i++) {
        correct[i].remove();
    }

    let fieldValue = document.forms["form_number"]["input_number"].value;

    function validatePhone(fieldValue) {
        var pattern = /^[0-9+]+$/;
        if (fieldValue.length < 12) {
            return false;
        }
        return pattern.test(fieldValue);
    }

    if (fieldValue == "") {
        event.preventDefault();
        inputNumber.classList.add('errorFocus')
        inputNumber.classList.remove('correctFocus')
        formNumber.insertAdjacentHTML('beforeend', `<div class="error">
        Заполните поле</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (validatePhone(fieldValue)) {
        event.preventDefault();
        inputNumber.classList.remove('errorFocus')
        inputNumber.classList.add('correctFocus')
        formNumber.insertAdjacentHTML('beforeend', `<div class="correct">
        Телефон введён корректно</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (!validatePhone(fieldValue) && !fieldValue == 0) {
        event.preventDefault();
        inputNumber.classList.add('errorFocus')
        inputNumber.classList.remove('correctFocus')
        formNumber.insertAdjacentHTML('beforeend', `<div class = "error"> Введите корректный номер телефона</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
})
let formEmail = document.querySelector('.js-form_email');
let inputEmail = document.querySelector('.input_email');

formEmail.addEventListener('submit', function (event) {
    event.preventDefault();
    let error = formEmail.querySelectorAll('.error')
    for (let i = 0; i < error.length; i++) {
        error[i].remove();
    }
    let correct = formEmail.querySelectorAll('.correct')
    for (let i = 0; i < correct.length; i++) {
        correct[i].remove();
    }

    let fieldValue = document.forms["form_email"]["input_email"].value;

    function validateEmail(fieldValue) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(fieldValue);
    }

    if (fieldValue == "") {
        event.preventDefault();
        inputEmail.classList.add('errorFocus')
        inputEmail.classList.remove('correctFocus')
        formEmail.insertAdjacentHTML('beforeend', `<div class="error">
        Заполните поле</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (validateEmail(fieldValue)) {
        event.preventDefault();
        inputEmail.classList.remove('errorFocus')
        inputEmail.classList.add('correctFocus')
        formEmail.insertAdjacentHTML('beforeend', `<div class="correct">
        Почтовый адрес введён корректно</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
    if (!validateEmail(fieldValue) && !fieldValue == 0) {
        event.preventDefault();
        inputEmail.classList.add('errorFocus')
        inputEmail.classList.remove('correctFocus')
        formEmail.insertAdjacentHTML('beforeend', `<div class = "error"> Введите корректный почтовый адрес</div>`)
        document.querySelector(".information__form").setAttribute("style", "grid-row-gap: 10px");
    }
})

var formData = new FormData();
let elements = document.querySelectorAll('.js-card')
let full = document.querySelector('.js-price-result')
formData.append('element1', elements.value);

document.querySelector('.js-submit').addEventListener('click', function () {
    console.log(elements);
    console.log(full);
});






