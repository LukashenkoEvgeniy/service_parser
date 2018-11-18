const needle = require('needle');
const cheerio = require('cheerio');
const querystring = require('querystring');
const axios = require('axios');

const translate = require('./utils')
const config = require('../config/config')


const LAST = 663;



module.exports = class SiteParser {

    constructor() {
        for (let i = 2; i < LAST; i++) {
            this.parse(`${config.URL}${i}/`).then(list => {
                // list.length && console.log(list)
                list.length && this.postList(list)
            })
        }
        console.log('FINISH')
    }


    postList(list){
        axios.post('http://localhost:8080/documents/',  list,  {
            headers: {'Content-Type': 'application/json'}
        })
            .then(function (response) {
            })
            .catch(function (error) {
            });
    }

    parse(url) {
        return needle('get', url)
            .then(
                (resp => {
                    let filmList = [];
                    const $ = cheerio.load(resp.body);
                    $('.shortstory').each((i, film) => {
                        let rating = $(film).find('.current-rating').text();
                        if (rating > 75) {
                            let name = $(film).find('.zagolovki').contents().text();
                            let descriptionBlock = null;
                            let id = null;
                            $(film).find('.shortimg').contents().each((i, element) => {
                                if ($(element).attr('id')) {
                                    id = $(element).attr('id');
                                    descriptionBlock = $(element);
                                }
                            });
                            let desc = $(descriptionBlock).text().split(`\n`).filter((str) => !!str);
                            let imgUrl = config.BASE_URL + $(descriptionBlock).find('img').attr('src');
                            let result = desc.reduce((object, item) => {

                                if (item.split(':').length === 1) {
                                    return {...object, description: item}
                                }
                                let [key, value] = item.split(':');
                                return {...object, [translate[key.trim()]]: value.trim()}
                            }, {name, rating, _id: id, posted: false, imgUrl: imgUrl});
                            filmList.push(result)
                        }
                    });
                    return filmList
                })
            )
            .catch(err => {
                throw err
            })
    }
};