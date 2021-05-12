// Creates random ID, using characters
// v 1.0.1
function makeId(length=8) {
    let result = '';
    const characters = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


// Создает артикул из числа
// num — номер в виде числа
// pad — разрядность артикула
// letter — префикс, который нужно добавить
//v2.0.1
function createArticle(num, pad=3, letter){
    const str = String(num)
    const article =  (letter ? letter + str.padStart((pad - letter.length), '0') : str.padStart(pad, '0'))
    console.log(article)
    return article
}
