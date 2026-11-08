import { router } from 'expo-router';
import { Text } from 'react-native';
import { Pantalla, Tarjeta, Texto, Boton, s } from '../ui/componentes';

// Aviso de privacidad (Ley 1581 de 2012). Mantener alineado con docs/datos.md.
const secciones: [string, string][] = [
  [
    'Qué guarda',
    'Las lecturas del equipo (pH, turbidez en NTU, sólidos disueltos en ppm y temperatura en °C), el nombre que le das a la fuente, el uso que elegiste, lo que observaste del agua y el resultado.',
  ],
  [
    'Qué no guarda',
    'Tu ubicación, tu nombre, tu número de teléfono ni la dirección Bluetooth del equipo en cada medición. El nombre de quien calibró queda solo en «Mi equipo».',
  ],
  [
    'Dónde',
    'Solo en este teléfono. La app no envía tus mediciones a internet. Si compartes un resultado, tú eliges a quién.',
  ],
  [
    'Tus derechos',
    'Puedes ver, exportar y borrar tus mediciones desde «Mis mediciones». Al borrar, no se pueden recuperar.',
  ],
  [
    'Un consejo',
    'Al nombrar la fuente, no escribas nombres de personas. Usa el nombre del lugar, como «Quebrada de la finca».',
  ],
];

export default function Datos() {
  return (
    <Pantalla titulo="Tus datos">
      {secciones.map(([titulo, texto]) => (
        <Tarjeta key={titulo}>
          <Text style={s.etiqueta}>{titulo.toUpperCase()}</Text>
          <Texto>{texto}</Texto>
        </Tarjeta>
      ))}
      <Boton texto="Ir a mis mediciones" onPress={() => router.push('/historial')} />
    </Pantalla>
  );
}
