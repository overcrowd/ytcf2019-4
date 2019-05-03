import {Storage, CarStatus} from "./Storage";

// import events = require('events');
// class Database extends events.EventEmitter {

// import {EventEmitter} from 'events';
// class Database extends EventEmitter {


// class Teleport {
//     private
// }


export class Worker {
    private store: Storage;
    private teleport: number[] = [];

    constructor() {
        this.store = new Storage();
    }

    public async start() {
        await this.store.load('./datain.txt');
        console.log("...");

        this.process();
    }

    private process(): void {
        for (let time in this.store.timeline) {
            console.log(`TIME = ${time}`)
            // console.log(this.store.timeline[time].trackedCars);
            // console.log(this.store.timeline[time].portal);

            // сначала берем все машины
            //   если машина не телепортирована, то проверяем треки
            // берем трек этого времени, проверяем попал ли он в телепорт
            //   если да, то заносим машину в телепорт (очередь)
            //   если нет, то убираем из телепорта, если есть там такая
            this.store.timeline[time].trackedCars.forEach(carId => {
                if (this.store.cars[carId].status === CarStatus.ON_TRACK) {
                    let curtrack = this.store.cars[carId].tracks[time];
                    this.store.portal.checkTrack(carId, curtrack);
                }
            });

            // потом смотрим, открывался ли телепорт в этот момент
            // если да, то
            //   - убираем самую раннюю машину из телепорта
            //   - помечаем такую машину, как телепортированную
            if (this.store.timeline[time].portal === "opened") {
                let teleportedCarId = this.store.portal.openPortal();
                if (teleportedCarId)
                    this.store.cars[teleportedCarId].status = CarStatus.TELEPORTED;
            }
        }
    }
}
