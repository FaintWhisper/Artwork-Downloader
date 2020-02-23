const request = require("ajax-request");
const fs = require("fs");
const path = require("path");
const APIURL = "https://itunesartwork.bendodson.com/api.php";

const search = parameters => {
    if (!parameters.query)
        console.log("Enter a valid parameters.query!");
    else if ((path.extname(parameters.o) == '.jpg' && fs.existsSync(path.dirname(parameters.o))) || (path.extname(parameters.o) == '' && fs.existsSync(parameters.o))) {
        if (path.extname(parameters.o) == '' && fs.existsSync(parameters.o))
            parameters.o += "cover.jpg";

        let url = "https://itunes.apple.com/";
        let shortFilm = false;

        if (parameters.entity == "shortFilm") {
            parameters.entity = "movie";
            shortFilm = true;
        }

        if (parameters.entity == "id" || parameters.entity == "idAlbum")
            url += `lookup?id=${encodeURIComponent(parameters.query)}&country=${parameters.country}`;
        else {
            url += `search?term=${encodeURIComponent(parameters.query)}&country=${parameters.country}&entity=${parameters.entity}`;
            if (shortFilm)
                url += "&attribute=shortFilmTerm";
        }

        console.log("Connecting to iTunes API...");
        request({
            type: "GET",
            crossDomain: true,
            url: url,
        }, (err, res, body) => {
            if (err)
                throw new Error("Could not connect to iTunes API");
            else {
                console.log("Succesfully connected!");
                console.log("Fetching results...")
                const data = JSON.parse(body);
                if (!data.resultCount)
                    console.log("No results found :(");
                else {
                    console.log(`Found ${data.resultCount} results`);
                    const url = data.results[0].artworkUrl100.replace("100x100", `${parameters.q}x${parameters.q}`);
                    console.log("Downloading best match...");
                    request.download({
                        type: "GET",
                        crossDomain: true,
                        url: url,
                        data: {},
                        dataType: "image/jpg",
                        destPath: path.normalize(parameters.o)
                    }, (err, res, body, destPath) => {
                        console.log(`${parameters.entity[0].toUpperCase() + parameters.entity.substring(1)} artwork succesfully downloaded!`)
                    });
                }
                if (parameters.list_all_results)
                    data.results.forEach((result, index) => {
                        console.log(`${index + 1}. Title: ${result.collectionName}`);
                        console.log(`   Standard Resolution: ${result.artworkUrl60.replace("60x60", "600x600")}`);
                        console.log(`   Hi-Res Resolution: ${result.artworkUrl100.replace("100x100", "1500x1500")}`);
                        console.log("\n");
                    });
            }
        });
    }
    else if (path.extname(parameters.o) != '' && !fs.existsSync(path.dirname(parameters.o)) || (path.extname(parameters.o) == '' && !fs.existsSync(parameters.o)))
        console.log("Enter a valid destination folder!");
    else if (path.extname(parameters.o) != '.jpg')
        console.log("File format should be JPG");
}

const parameters = {
    query: "",
    entity: "album",
    country: "us",
    q: "600",
    o: "./cover.jpg",
    list_all_results: false
}

const args = process.argv.slice(2);

if (args.includes("--help") || !args) {
    console.log("Syntax: -q <artwork_quality> -entity [album, movie, tvShow, ...] -country [us, es, uk, ...], -o <destination_folder> -list_all_results [true/false]");
} else {
    parameters.query = args[0];
    Object.keys(parameters).forEach(key => {
        if (key != "parameters.query") {
            const index = args.findIndex(arg => {
                return arg == `-${key}`;
            });
            if (index != -1)
                parameters[key] = args[index + 1];
        }
    });

    search(parameters);
}