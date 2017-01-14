var getCarsByCategory = function (category) {
    if (category == "Cars & Minivans") {
        var carArray = [
            "2017 Yaris",
            "2017 Yaris iA",
            "2017 Corolla",
            "2017 Corolla iM",
            "2017 Camry",
            "2017 Avalon",
            "2017 Sienna",
            "2017 86"
        ];
        return carArray;

    }
}
var getCarUrls = function () {
    var urlsArray = {
        "2017 Yaris": {
            "build": "http://www.toyota.com/configurator/#!/series/yaris",
            "explore": "http://www.toyota.com/local-specials/#!/series/yaris/year/2017"
        },
        "2017 Yaris iA": {
            "build": "http://www.toyota.com/configurator/#!/series/yarisia",
            "explore": "http://www.toyota.com/local-specials/#!/series/yarisia/year/2017"
        },
        "2017 Corolla": {
            "build": "http://www.toyota.com/configurator/#!/series/corolla",
            "explore": "http://www.toyota.com/local-specials/#!/series/corolla/year/2017"
        },
        "2017 Camry": {
            "build": "http://www.toyota.com/configurator/#!/series/camry",
            "explore": "http://www.toyota.com/local-specials/#!/series/camry/year/2017"
        },
        "2017 Corolla iM": {
            "build": "http://www.toyota.com/configurator/#!/series/corollaim",
            "explore": "http://www.toyota.com/local-specials/#!/series/corollaim/year/2017"
        },
        "2017 Avalon": {
            "build": "http://www.toyota.com/configurator/#!/series/avalon",
            "explore": "http://www.toyota.com/local-specials/#!/series/avalon/year/2017"
        },
        "2017 Sienna": {
            "build": "http://www.toyota.com/configurator/#!/series/sienna",
            "explore": "http://www.toyota.com/local-specials/#!/series/sienna/year/2017"
        },
        "2017 Highlander": {
            "build": "http://www.toyota.com/configurator/#!/build/step/model/year/2017/series/highlander",
            "explore": "http://www.toyota.com/highlander/"
        },
        "2017 Avalon Hybrid": {
            "build": "http://www.toyota.com/configurator/#!/build/step/model/year/2017/series/avalonhybrid",
            "explore": "http://www.toyota.com/avalonhybrid/"
        },
        "2017 86": {
            "build": "http://www.toyota.com/configurator/#!/build/step/model/year/2017/series/86",
            "explore": "http://www.toyota.com/local-specials/#!/series/86/year/2017"
        }

    }
    return urlsArray;
}
module.exports.getCarsByCategory = getCarsByCategory;
module.exports.getCarUrls = getCarUrls;