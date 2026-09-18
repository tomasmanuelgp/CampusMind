import { PermissionsAndroid, Platform } from 'react-native';
import Bluetooth, { type BluetoothDevice } from 'react-native-bluetooth-classic';
export interface Equipo { id: string; nombre: string; emparejado: boolean }
const equipos = new Map<string,BluetoothDevice>();
export async function prepararBluetooth() {
  if (Platform.OS !== 'android') throw new Error('La conexión al equipo requiere la app Android.');
  const permisos = Number(Platform.Version) >= 31
    ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const resultado = await PermissionsAndroid.requestMultiple(permisos);
  if (permisos.some(p => resultado[p] !== PermissionsAndroid.RESULTS.GRANTED))
    throw new Error('Necesitamos permiso para encontrar tu equipo. Puedes activarlo en Ajustes. No guardamos tu ubicación.');
  if (!await Bluetooth.isBluetoothAvailable()) throw new Error('Este teléfono no tiene Bluetooth disponible.');
  if (!await Bluetooth.isBluetoothEnabled() && !await Bluetooth.requestBluetoothEnabled())
    throw new Error('Activa Bluetooth para conectar el equipo.');
}
const convertir = (e: BluetoothDevice): Equipo => {
  equipos.set(e.address,e);
  return {id:e.address,nombre:e.name || 'Equipo sin nombre',emparejado:!!e.bonded};
};
export async function buscarEquipos(): Promise<Equipo[]> {
  await prepararBluetooth();
  const encontrados = [...await Bluetooth.getBondedDevices(), ...await Bluetooth.startDiscovery()];
  return [...new Map(encontrados.map(e => [e.address,convertir(e)])).values()]
    .sort((a,b) => Number(/re.?fluye/i.test(b.nombre))-Number(/re.?fluye/i.test(a.nombre)));
}
export async function conectarEquipo(id: string, recibir: (datos:string)=>void, desconectado:()=>void) {
  await prepararBluetooth();
  await Bluetooth.cancelDiscovery();
  if (equipos.has(id) && !equipos.get(id)?.bonded) await Bluetooth.pairDevice(id);
  const equipo = await Bluetooth.connectToDevice(id, {
    connectorType: 'rfcomm', connectionType: 'delimited', delimiter: '\n', charset: 'UTF-8',
  });
  const lectura = equipo.onDataReceived(evento => recibir(evento.data.endsWith('\n') ? evento.data : evento.data+'\n'));
  const cierre = Bluetooth.onDeviceDisconnected(evento => { if (evento.device.address === id) desconectado(); });
  return async () => { lectura.remove(); cierre.remove(); await equipo.disconnect(); };
}
