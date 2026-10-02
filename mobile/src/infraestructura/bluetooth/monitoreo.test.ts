import {describe,it,expect} from 'vitest';
import {leerTrama} from './parser';
import {lecturaEnVivo,segmentosSensor} from './monitoreo';
const lectura=(ph:string,t=1000)=>leerTrama(`pH:${ph}\nTDS:145\nTURB:2\nTEMP:24`,t)!;
describe('monitoreo independiente del análisis',()=>{
  it('muestra otros sensores aunque un campo sea inválido o falte',()=>{
    const l=lectura('inválido');expect(l.errores.length).toBeGreaterThan(0);
    expect(lecturaEnVivo([l],'recibiendo',1000)).toMatchObject({ph:null,tds:145,temperatura:24});
  });
  it('usa la última lectura cambiante sin esperar cuatro tramas',()=>{
    expect(lecturaEnVivo([lectura('7'),lectura('8',2500)],'recibiendo',2500)?.ph).toBe(8);
  });
  it('no presenta lecturas antiguas o desconectadas como actuales',()=>{
    expect(lecturaEnVivo([lectura('7')],'recibiendo',6000)).toBeNull();
    expect(lecturaEnVivo([lectura('7')],'desconectado',1000)).toBeNull();
    expect(lecturaEnVivo([lectura('7')],'recibiendo',999)).toBeNull();
  });
  it('la curva corta huecos, errores y valores fuera de rango',()=>{
    const l=[lectura('7'),lectura('8',2500),lectura('bad',4000),lectura('9',5500),lectura('9',11000),lectura('15',12500)];
    expect(segmentosSensor(l,'ph').map(s=>s.length)).toEqual([2,1,1]);
    expect(segmentosSensor([lectura('bad')],'ph')).toEqual([]);
    expect(segmentosSensor([lectura('7'),lectura('7',2500)],'ph')[0].map(p=>p[1])).toEqual([25,25]);
  });
});
