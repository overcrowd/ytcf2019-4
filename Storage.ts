const util = require("util");
const fs = require('fs');

import { Apex, Polygon } from "./Polygon";




export enum CarStatus {
    ON_TRACK = "ontrack",
    TELEPORTED = "teleported"
}
interface Car {
    status: CarStatus,
    tracks: {[time: number]: Apex}
}

interface Timeline {
    [time: number]: {
        portal: "opened" | null,
        trackedCars: number[]
    }
}
interface Cars {
    [carId: number]: Car
}



export class Storage {
    private _polygon: Polygon;
    private _timeline: Timeline = {};
    private _cars: Cars = {};


    public async load(filename: string): Promise<any> {
        const readFile = util.promisify(fs.readFile);

        let data = await readFile(filename, 'utf8');
        data = data.split('\n');
        // console.log('arr', data);


        let nApex = parseInt(data[0]);

        this._polygon = new Polygon();
        let dots: number[] = data[1].split(" ").map(element => parseInt(element));
        for (let i = 0; i < nApex; i++) {
            this._polygon.addApex( {x: dots[i*2], y: dots[i*2 + 1]} );
        }

        let nCars = parseInt(data[2]);
        for (let carId = 1; carId <= nCars; carId++) {

            this._cars[ carId ] = {
                status: CarStatus.ON_TRACK,
                tracks: {}
            }

            let trackdata = data[carId + 2].split(" ").map(element => parseInt(element));
            let nTracks = trackdata[0];
            for (let itrack = 0; itrack < nTracks; itrack++) {
                let time = trackdata[itrack*3 + 1],
                    x = trackdata[itrack*3 + 2],
                    y = trackdata[itrack*3 + 3];
                // console.log(`track {time=${time}, x: ${x}, y: ${y}}`);

                // каждый трек пишем
                // 1) в машину
                this._cars[ carId ].tracks[time] = {x, y};

                // 2) а на временнУю метку трека в timeline ставим ссылку на авто
                if (!this._timeline[time])
                    this._timeline[time] = {
                        portal: null,
                        trackedCars: []
                    }
                this._timeline[time].trackedCars.push(carId);
            }
        }
        // console.log(nApex, dots, this._polygon, nCars);

        let portaldata = data[ data.length-2 ].split(' ');
        for (let i = 1; i < portaldata.length; i++) {
            let time = portaldata[i];
            // console.log(`portal ${time}`);

            if (!this._timeline[time])
                this._timeline[time] = {
                    portal: "opened",
                    trackedCars: []
                }
            else
                this._timeline[time].portal = "opened";
        }

        console.log("CARS: ", util.inspect(this._cars, null, 3));
        console.log("TIMELINE: ", this._timeline);

        return Promise.resolve();
    }


    get timeline(): Timeline {
        return this._timeline;
    }
    get cars(): Cars {
        return this._cars;
    }
    get polygon(): Polygon {
        return this._polygon;
    }
}
