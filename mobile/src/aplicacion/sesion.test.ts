import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({
  conectar:vi.fn(),cerrar:vi.fn(),ajuste:vi.fn(),leer:vi.fn(),borrador:vi.fn(),completar:vi.fn(),
  recibir:null as null|((s:string)=>void),perder:null as null|(()=>void),
}));
vi.mock('expo-crypto',()=>({randomUUID:()=> 'captura-prueba'}));
vi.mock('../infraestructura/bluetooth/servicio',()=>({conectarEquipo:mocks.conectar}));
vi.mock('../infraestructura/db/repositorio',()=>({guardarAjuste:mocks.ajuste,leerAjuste:mocks.leer,
  guardarBorrador:mocks.borrador,completarCaptura:mocks.completar}));
import {useSesion} from './sesion';
const trama=(ph=7.4)=>`VER:1\npH:${ph}\nTDS:100\nTURB:2\nTEMP:24\n---\n`;
beforeEach(async()=>{
  await useSesion.getState().desconectar();vi.resetAllMocks();vi.useFakeTimers();vi.setSystemTime(100000);
  useSesion.setState({estado:'desconectado',equipo:'',nombreEquipo:'',demo:false,lecturas:[],error:null,captura:null});
  mocks.cerrar.mockResolvedValue(undefined);mocks.leer.mockReturnValue(null);
  mocks.conectar.mockImplementation(async(_id,recibir,perder)=>{mocks.recibir=recibir;mocks.perder=perder;return mocks.cerrar;});
});
afterEach(async()=>{await useSesion.getState().desconectar();vi.useRealTimers();});
async function estable(){
  await useSesion.getState().conectar('A','Re-Fluye A');
  for(let n=0;n<4;n++){vi.setSystemTime(100000+n*1500);mocks.recibir!(trama());}
}
describe('sesión de campo',()=>{
  it('congela la lectura y permite finalizar después de perder Bluetooth',async()=>{
    await estable();const c=useSesion.getState().capturar('Quebrada');
    mocks.recibir!(trama(9));mocks.perder!();
    expect(useSesion.getState().captura?.lectura.ph).toBe(7.4);
    expect(useSesion.getState().lecturas).toEqual([]);
    useSesion.getState().observar({origen:'corriente',olor:'raro',visual:'limpia'});
    expect(useSesion.getState().finalizar()).toBe(c.id);
    expect(mocks.completar.mock.calls[0][1]).toMatchObject({nivel:2,confiable:false,plan:'alternativa'});
  });
  it('no avanza cuando SQLite falla al capturar o finalizar',async()=>{
    await estable();mocks.borrador.mockImplementationOnce(()=>{throw new Error('disco');});
    expect(()=>useSesion.getState().capturar('Fuente')).toThrow();expect(useSesion.getState().captura).toBeNull();
    useSesion.getState().capturar('Fuente');useSesion.getState().observar({origen:'corriente',olor:'normal',visual:'limpia'});
    mocks.completar.mockImplementationOnce(()=>{throw new Error('disco');});
    expect(()=>useSesion.getState().finalizar()).toThrow();expect(useSesion.getState().captura).not.toBeNull();
  });
  it('rechaza capturar valores antiguos y finalizar sin las tres respuestas',async()=>{
    await estable();useSesion.getState().capturar('Fuente');
    expect(()=>useSesion.getState().finalizar()).toThrow('Completa');
    vi.setSystemTime(110000);expect(()=>useSesion.getState().capturar('Fuente')).toThrow('reciente');
  });
  it('permite analizar desde la primera trama y la identifica como inicial',async()=>{
    await useSesion.getState().conectar('A','Re-Fluye A');
    mocks.recibir!(trama());
    const captura=useSesion.getState().capturar('Fuente','cocinar');
    expect(captura.estabilidad).toBe('inicial');
    useSesion.getState().observar({origen:'corriente',olor:'normal',visual:'limpia'});
    useSesion.getState().finalizar();
    expect(mocks.completar.mock.calls[0][1]).toMatchObject({confiable:false,plan:'repetir'});
  });
  it('ignora callbacks de la conexión anterior',async()=>{
    await estable();const anterior=mocks.recibir!;
    await useSesion.getState().conectar('B','Re-Fluye B');anterior(trama());
    expect(useSesion.getState().lecturas).toEqual([]);expect(useSesion.getState().equipo).toBe('B');
  });
  it('reintenta el mismo equipo tres veces y se detiene',async()=>{
    await estable();mocks.conectar.mockRejectedValue(new Error('ausente'));mocks.perder!();mocks.perder!();
    await vi.advanceTimersByTimeAsync(20000);
    expect(mocks.conectar).toHaveBeenCalledTimes(4);
    expect(mocks.conectar.mock.calls.every(c=>c[0]==='A')).toBe(true);
    expect(useSesion.getState().estado).toBe('desconectado');
    await vi.advanceTimersByTimeAsync(60000);expect(mocks.conectar).toHaveBeenCalledTimes(4);
  });
  it('cancelar impide una reconexión automática pendiente',async()=>{
    await estable();mocks.perder!();await useSesion.getState().desconectar();
    await vi.advanceTimersByTimeAsync(20000);expect(mocks.conectar).toHaveBeenCalledTimes(1);
  });
  it('un rechazo inicial no crea un bucle de solicitudes de permisos',async()=>{
    mocks.conectar.mockRejectedValue(new Error('permiso denegado'));
    await useSesion.getState().conectar('A','Re-Fluye A');await vi.advanceTimersByTimeAsync(20000);
    expect(mocks.conectar).toHaveBeenCalledTimes(1);expect(useSesion.getState().error).toBe('permiso denegado');
  });
  it('DEMO nunca toca Bluetooth y todas sus capturas quedan identificadas',async()=>{
    await useSesion.getState().iniciarDemo();await vi.advanceTimersByTimeAsync(4500);
    const captura=useSesion.getState().capturar('Práctica','banarse');
    expect(captura.demo).toBe(true);expect(captura.uso).toBe('banarse');
    expect(mocks.borrador.mock.calls.at(-1)?.[0]).toMatchObject({uso:'banarse'});
    expect(mocks.conectar).not.toHaveBeenCalled();
  });
});
