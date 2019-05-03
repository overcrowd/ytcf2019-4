const util = require("util");
const fs = require('fs');
import * as winston from "winston";

import { Coord, Portal } from "./Portal";




export enum CarStatus {
    ON_TRACK = "ontrack",
    TELEPORTED = "teleported"
}

type Car = {
    status: CarStatus,
    tracks: {[time: number]: Coord}
}
interface Cars {
    [carId: number]: Car
}

type portalOpened = "opened" | null;
interface Timeline {
    [time: number]: {
        portal: portalOpened,
        trackedCars: number[]
    }
}



export class Storage {
    private _portal: Portal;
    private _timeline: Timeline = {};
    private _cars: Cars = {};


    constructor(private logger: winston.Logger) {
        this._portal = new Portal(this.logger);
    }


    public async load(filename: string): Promise<any> {
        const readFile = util.promisify(fs.readFile);

        let data = await readFile(filename, 'utf8');
        data = data.split('\n');

        let nApex = parseInt(data[0]);

        let dots: number[] = data[1].split(" ").map(element => parseInt(element));
        for (let i = 0; i < nApex; i++) {
            this._portal.addApex( {x: dots[i*2], y: dots[i*2 + 1]} );
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

        let portaldata = data[ data.length-2 ].split(' ');
        for (let i = 1; i < portaldata.length; i++) {
            let time = portaldata[i];

            if (!this._timeline[time])
                this._timeline[time] = {
                    portal: "opened",
                    trackedCars: []
                }
            else
                this._timeline[time].portal = "opened";
        }

        this.logger.debug("CARS: " + util.inspect(this._cars, null, 3));
        this.logger.debug("TIMELINE: " + util.inspect(this._timeline, null, 3));
        return Promise.resolve();
    }


    get timeline(): Timeline {
        return this._timeline;
    }
    get cars(): Cars {
        return this._cars;
    }
    get portal(): Portal {
        return this._portal;
    }
}
