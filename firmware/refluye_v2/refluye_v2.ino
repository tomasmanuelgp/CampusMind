/*
 * Re-Fluye V2.3 - ESP32
 *
 * Basado en el codigo V2.0 de "Re-Fluye_V2_ESP32_Guia_Tecnica_parte2.docx" 6.1
 * (Alfredo Antonio Diaz Claros - CCD, UNAB), con:
 *   - los tres cambios intencionales de la V2.1 (sin pulsadores, logica
 *     observacional delegada a la app, ESTADO numerico)
 *   - las correcciones F1-F4 documentadas en refluye/contexto/02
 *   - la linea VER del protocolo (refluye/contexto/03)
 *   - V2.3: la pantalla y los LED ya no muestran un veredicto (regla S1).
 *     El equipo solo con sensores no puede saber si el agua sirve para
 *     beber: no ve microbios, olor ni color. La trama Bluetooth no cambia.
 *
 * ARQUITECTURA
 *   El ESP32 mide y transmite. No decide y no recibe comandos.
 *   Las observaciones humanas (origen, olor, aspecto) las captura la app,
 *   que es quien calcula el veredicto final.
 *
 * PROTOCOLO (normativo: refluye/contexto/03-protocolo-bluetooth.md)
 *   Bluetooth Classic SPP - nombre "ReFluye-V2" - PIN 1234 - trama cada 1.5 s
 *
 *     VER:1
 *     ESTADO:<0|1|2>
 *     ICA:<0.0-100.0>
 *     pH:<0.00-14.00>
 *     TDS:<ppm>
 *     TURB:<NTU>
 *     TEMP:<C, o -127.0 si el sensor no responde>
 *     ---
 *
 * HARDWARE
 *   ESP32 DevKit v1 + DFRobot pH V1.1 + TDS V1.0 + turbidez analogica
 *   + DS18B20 + LCD I2C 16x2 + 3 LEDs
 *
 * SIGNIFICADO DE LOS LED (ninguno autoriza consumir el agua)
 *   Verde    -> la app esta conectada por Bluetooth
 *   Amarillo -> parpadea en cada medicion (el equipo esta midiendo)
 *   Rojo     -> algun sensor esta en el limite de su escala o no responde
 *
 * DEFECTOS CONOCIDOS DE LA PCB (ver refluye/contexto/02)
 *   P1: el SCL del LCD esta ruteado al pin Tx, no a GPIO22 -> el LCD no
 *       funcionara en la placa fabricada. En protoboard, cablear a GPIO22.
 *   P2: falta el pull-up de 4.7k del DS18B20 -> TEMP llegara como -127.
 *       Anadir la resistencia entre DATA y 3.3V.
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <BluetoothSerial.h>

// --- Objetos ---------------------------------------------------------------
LiquidCrystal_I2C lcd(0x27, 16, 2);
BluetoothSerial   SerialBT;

#define ONE_WIRE_BUS 4
OneWire           oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// --- Pines analogicos (ADC1: seguro con Bluetooth activo) ------------------
const int PIN_PH   = 34;   // solo entrada
const int PIN_TURB = 35;   // solo entrada
const int PIN_TDS  = 32;

// --- LEDs ------------------------------------------------------------------
const int LED_VERDE    = 26;
const int LED_AMARILLO = 25;
const int LED_ROJO     = 33;

// --- Divisor de voltaje 10k + 20k ------------------------------------------
const float DIV_FACTOR = 1.5;

// --- Calibracion de pH -----------------------------------------------------
// Valores genericos de DFRobot. Calibrar con buffers 4.0 y 7.0 segun el
// procedimiento de la guia tecnica parte 2, seccion 7.3.
const float PH_SLOPE  = 3.5;
const float PH_OFFSET = 0.0;

// --- Protocolo -------------------------------------------------------------
const int PROTOCOLO_VERSION = 1;
const unsigned long INTERVALO_MS = 1500;

// --- Promediado de ADC (F2) ------------------------------------------------
const int NUM_MUESTRAS = 10;

// --- Medicion --------------------------------------------------------------
float valorPH, valorTurb, valorTDS, ica, valorTemp;
int   clasificacion;      // preclasificacion enviada como ESTADO; no es veredicto
bool  sensorEnLimite;     // algun sensor saturado o desconectado

// Lee el voltaje real del sensor en mV, compensando el divisor.
// Usa analogReadMilliVolts(), que aplica la calibracion de fabrica del ADC
// grabada en el eFuse: el ADC del ESP32 no es lineal y la conversion
// raw*3300/4095 arrastra un error de +-100..200 mV (F3).
float leerVoltajeSensor(int pin) {
  uint32_t suma = 0;
  for (int i = 0; i < NUM_MUESTRAS; i++) {
    suma += analogReadMilliVolts(pin);
    delay(2);
  }
  return (suma / (float)NUM_MUESTRAS) * DIV_FACTOR;
}

void setup() {
  Serial.begin(115200);
  SerialBT.begin("ReFluye-V2");
  sensors.begin();
  sensors.setWaitForConversion(false);   // no bloquear el loop (F1)

  pinMode(LED_VERDE,    OUTPUT);
  pinMode(LED_AMARILLO, OUTPUT);
  pinMode(LED_ROJO,     OUTPUT);

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0); lcd.print("RE-FLUYE V2.3");
  lcd.setCursor(0, 1); lcd.print("App -> Bluetooth");
  delay(2000);
  lcd.clear();

  sensors.requestTemperatures();
}

void loop() {
  static unsigned long tUpdate = 0;
  if (millis() - tUpdate < INTERVALO_MS) return;
  tUpdate = millis();

  // --- 1. Lectura de sensores ---------------------------------------------
  float vPH_mV = leerVoltajeSensor(PIN_PH);
  valorPH = PH_SLOPE * (vPH_mV / 1000.0) + PH_OFFSET;
  valorPH = constrain(valorPH, 0.0, 14.0);

  float vTurb_mV = leerVoltajeSensor(PIN_TURB);
  valorTurb = map((int)vTurb_mV, 2500, 5000, 200, 0);
  valorTurb = constrain(valorTurb, 0, 200);

  float vTDS_V = leerVoltajeSensor(PIN_TDS) / 1000.0;
  valorTDS = (133.42 * pow(vTDS_V, 3)
            - 255.86 * pow(vTDS_V, 2)
            + 857.39 * vTDS_V) * 0.5;
  valorTDS = constrain(valorTDS, 0, 2000);

  // La conversion se pidio en el ciclo anterior, asi que el dato ya esta
  // listo y getTempCByIndex() no bloquea (F1).
  valorTemp = sensors.getTempCByIndex(0);
  sensors.requestTemperatures();

  // --- 2. ICA (solo sensores) ---------------------------------------------
  // La app aplica el ajuste final con las variables observacionales.
  // Cada sub-indice se acota a 0..100 para que un parametro extremo no
  // arrastre a los demas fuera de escala (F4).
  float sPH = constrain(100.0 - (fabs(valorPH - 7.4) * 30.0), 0.0, 100.0);
  float sTU = constrain(100.0 - (valorTurb / 2.0),            0.0, 100.0);
  float sTD = constrain(100.0 - (valorTDS  / 20.0),           0.0, 100.0);
  ica = constrain((sPH * 0.4) + (sTU * 0.3) + (sTD * 0.3), 0.0, 100.0);

  // --- 3. Preclasificacion base ------------------------------------------
  // Solo se envia como ESTADO para compatibilidad del protocolo. La app la
  // ignora como veredicto: decide con sensores + observaciones humanas.
  if (ica < 50 || valorPH < 5.0 || valorPH > 9.0) clasificacion = 2;
  else if (ica < 75)                                clasificacion = 1;
  else                                              clasificacion = 0;

  sensorEnLimite = valorPH <= 0.0 || valorPH >= 14.0 ||
                   valorTurb >= 200 || valorTDS >= 2000 ||
                   valorTemp == DEVICE_DISCONNECTED_C;

  // --- 4. LCD: datos, nunca un veredicto ----------------------------------
  lcd.setCursor(0, 0);
  lcd.print("ICA ");
  lcd.print((int)ica);
  lcd.print(sensorEnLimite ? " REVISAR " : " VER APP ");
  lcd.print("   ");

  lcd.setCursor(0, 1);
  lcd.print("pH:"); lcd.print(valorPH, 1);
  lcd.print(" T:");
  if (valorTemp == DEVICE_DISCONNECTED_C) lcd.print("--C ");
  else { lcd.print((int)valorTemp); lcd.print("C  "); }

  // --- 5. Monitor serie ----------------------------------------------------
  Serial.println("======= RE-FLUYE V2.2 =======");
  Serial.print("pH: ");     Serial.println(valorPH, 2);
  Serial.print("TDS: ");    Serial.println(valorTDS, 0);
  Serial.print("Turb: ");   Serial.println(valorTurb, 0);
  Serial.print("Temp: ");   Serial.println(valorTemp, 1);
  Serial.print("ICA: ");    Serial.println(ica, 1);
  Serial.print("ESTADO (no es veredicto): "); Serial.println(clasificacion);
  Serial.println("=============================");

  // --- 6. Bluetooth: trama del protocolo -----------------------------------
  SerialBT.print("VER:");    SerialBT.println(PROTOCOLO_VERSION);
  SerialBT.print("ESTADO:"); SerialBT.println(clasificacion);
  SerialBT.print("ICA:");    SerialBT.println(ica, 1);
  SerialBT.print("pH:");     SerialBT.println(valorPH, 2);
  SerialBT.print("TDS:");    SerialBT.println(valorTDS, 0);
  SerialBT.print("TURB:");   SerialBT.println(valorTurb, 0);
  SerialBT.print("TEMP:");   SerialBT.println(valorTemp, 1);
  SerialBT.println("---");

  // --- 7. LEDs: estado del equipo, nunca calidad del agua -----------------
  digitalWrite(LED_VERDE,    SerialBT.hasClient() ? HIGH : LOW);
  digitalWrite(LED_AMARILLO, HIGH);   // se apaga al inicio del siguiente ciclo
  digitalWrite(LED_ROJO,     sensorEnLimite ? HIGH : LOW);
  delay(80);
  digitalWrite(LED_AMARILLO, LOW);
}
