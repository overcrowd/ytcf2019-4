import * as winston from "winston";
import {Storage, CarStatus} from "./Storage";


export class Worker {
    private logger: winston.Logger;
    // log.debug('hello');
    // log.error({logtoken: 'BF455DEC838A', message: "beeing belling is a defeat for the cat"});
    private store: Storage;
    private teleport: number[] = [];


    constructor() {
        this.logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(msg => `${msg.timestamp} [${msg.level}]: ${msg.logtoken ? msg.logtoken + " - " + msg.message : msg.message}`)
            ),
            transports: [
                new winston.transports.Console({level: 'debug'})
            ]
        });
        this.store = new Storage(this.logger);
    }


    public async start() {
        await this.store.load('./datain.txt');

        this.process();
    }


    private process(): void {
        this.logger.info("start processing...");
        for (let time in this.store.timeline) {
            this.logger.info(`TIME = ${time}`)

            // сначала берем все машины
            //   если машина не телепортирована, то проверяем треки
            // берем трек этого времени, проверяем попал ли он в телепорт
            //   если да, то заносим машину в телепорт (очередь)
            //   если нет, то убираем из телепорта, если есть там такая
            this.store.timeline[time].trackedCars.forEach(carId => {
                if (this.store.cars[carId].status === CarStatus.ON_TRACK) {
                    let coord = this.store.cars[carId].tracks[time];
                    this.store.portal.checkCarLocation(carId, coord);
                }
            });

            // потом смотрим, открывался ли телепорт в этот момент
            // если да, то
            //   - убираем самую раннюю машину из телепорта
            //   - помечаем такую машину, как телепортированную
            if (this.store.timeline[time].portal === "opened") {
                let teleportedCarId = this.store.portal.openPortal();
                if (teleportedCarId) {
                    this.store.cars[teleportedCarId].status = CarStatus.TELEPORTED;
                    this.logger.debug("car status marked as teleported");
                }
            }
        }
    }
}
