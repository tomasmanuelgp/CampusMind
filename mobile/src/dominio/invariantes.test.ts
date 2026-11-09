// SPDX-License-Identifier: AGPL-3.0-only
// Invariantes de seguridad S1–S8 (ver CLAUDE.md).
// Estas pruebas no describen un caso concreto: recorren muchas combinaciones
// y el código fuente para que ningún cambio futuro rompa una regla sin que
// la integración continua lo detecte.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluar, DESCARGO } from './motor';
import { orientarUso, nombresUso } from './orientacion';
import { resumirEnVivo } from './resumenEnVivo';
import { protocolos } from './protocolos';
import { guiasRecomendadas } from './guias';
import type { Lectura, Observacion, Calibracion, Uso } from './tipos';

const lectura: Lectura = {
  ph: 7.4,
  tds: 145,
  turbidez: 2,
  temperatura: 24,
  icaDispositivo: 96,
  estadoDispositivo: 0,
  versionProtocolo: 1,
  recibidaEn: 1000,
  errores: [],
};
const calibracion: Calibracion = {
  verificadaEn: 0,
  venceEn: 2000,
  responsable: 'Técnica',
  referencia: 'Registro',
};
const usos = Object.keys(nombresUso) as Uso[];

/** Recorre lecturas, observaciones, calibración y estabilidad. */
function* combinaciones() {
  for (const ph of [null, 4, 6, 7.4, 9, 10])
    for (const turbidez of [null, 0, 30, 150])
      for (const tds of [null, 100, 800, 1600])
        for (const origen of ['corriente', 'estancada', 'no_se'] as const)
          for (const olor of ['normal', 'raro', 'no_se'] as const)
            for (const visual of ['limpia', 'verdosa', 'aceitosa', 'turbia', 'no_se'] as const)
              for (const cal of [calibracion, null])
                for (const estable of [true, false]) {
                  const o: Observacion = { origen, olor, visual };
                  yield { o, cal, estable, r: evaluar({ ...lectura, ph, turbidez, tds }, o, cal, estable) };
                }
}

describe('S1 · ninguna pantalla dice «potable», «apta» o «segura» a secas', () => {
  const prohibidas = /\b(potables?|apt[ao]s?|segur[ao]s?|bebible)\b/i;
  const negacion = /\b(no|nunca|ni)\b/i;
  const raiz = join(__dirname, '..');
  const fuentes = ['dominio', 'app', 'ui', 'aplicacion'].flatMap(carpeta =>
    readdirSync(join(raiz, carpeta))
      .filter(f => /\.tsx?$/.test(f) && !f.includes('.test.'))
      .map(f => join(raiz, carpeta, f)),
  );

  it('cada mención aparece negada en el mismo texto', () => {
    expect(fuentes.length).toBeGreaterThan(10);
    for (const archivo of fuentes) {
      const textos = readFileSync(archivo, 'utf8').match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`|>[^<>{}]+</g) ?? [];
      for (const texto of textos)
        if (prohibidas.test(texto)) expect(negacion.test(texto), `${archivo}: ${texto}`).toBe(true);
    }
  });
  it('el firmware tampoco muestra un veredicto en la pantalla', () => {
    const ino = readFileSync(join(raiz, '..', '..', 'firmware', 'refluye_v2', 'refluye_v2.ino'), 'utf8');
    const pantalla = [...ino.matchAll(/lcd\.print\("([^"]*)"\)/g)].map(m => m[1]).join(' ');
    expect(pantalla).not.toMatch(/EXCELENTE|APTA|POTABLE|SEGUR|BUENA/i);
  });
});

describe('S2 · el consumo humano siempre exige desinfección', () => {
  it('ningún resultado autoriza beber o cocinar sin aclarar y desinfectar', () => {
    for (const { r } of combinaciones()) {
      expect(r.destinos.humano).toMatch(/desinfección|No consumir/);
      for (const uso of ['beber', 'cocinar'] as const) {
        const pasos = orientarUso(r, uso).pasos.join(' ');
        if (r.plan === 'hervido') expect(pasos).toMatch(/hirviendo 3 minutos/);
        else expect(pasos).toMatch(/No uses|No decidas/);
      }
    }
  });
  it('aun la lectura más favorable pide desinfectar', () => {
    const r = evaluar(
      { ...lectura, ph: 7.4, tds: 0, turbidez: 0 },
      { origen: 'corriente', olor: 'normal', visual: 'limpia' },
      calibracion,
    );
    expect(r.ica).toBe(100);
    expect(r.motivo).toContain('desinfecta');
    expect(r.destinos.humano).toContain('desinfección');
  });
});

describe('S4 y S5 · vetos que nada anula', () => {
  it('un olor extraño siempre lleva a buscar otra fuente', () => {
    for (const { o, r } of combinaciones())
      if (o.olor === 'raro') {
        expect(r.nivel).toBe(2);
        expect(r.plan).toBe('alternativa');
        expect(r.reglas).toContain('R02');
      }
  });
  it('el agua verdosa nunca se resuelve solo hirviendo', () => {
    for (const { o, r } of combinaciones()) if (o.visual === 'verdosa') expect(r.plan).toBe('alternativa');
  });
  it('las guías sugeridas nunca abren un tratamiento que el motor no permite', () => {
    for (const { o, r } of combinaciones()) {
      const guias = guiasRecomendadas(r, o);
      if (r.plan !== 'hervido') {
        expect(guias).not.toContain('aclarar');
        expect(guias).not.toContain('guardar');
      }
      if (o.visual === 'verdosa') expect(guias[0]).toBe('agua-verde');
      expect(guias.length).toBeLessThanOrEqual(3);
    }
  });
  it('el protocolo de hervido advierte lo que no elimina', () => {
    expect(protocolos.hervido.limites).toMatch(/químicos/);
    expect(protocolos.hervido.limites).toMatch(/toxinas de algas/);
    expect(protocolos.hervido.limites).toMatch(/color verdoso/);
    expect(protocolos.alternativa.limites).toMatch(/no resuelve/);
  });
});

describe('S6 · todo resultado muestra el descargo microbiológico', () => {
  it('en el resultado del motor y en la conclusión en vivo', () => {
    for (const { o, r } of combinaciones()) {
      expect(r.advertencias[0]).toBe(DESCARGO);
      expect(resumirEnVivo(lectura, o, calibracion).descargo).toBe(DESCARGO);
    }
  });
});

describe('S7 · calibración ausente o vencida no es confiable', () => {
  it('sin calibración, o vencida, nunca hay resultado confiable ni tratamiento', () => {
    for (const { cal, estable, r } of combinaciones()) {
      if (cal === null) {
        expect(r.confiable).toBe(false);
        expect(r.plan).not.toBe('hervido');
      }
      // Una lectura inicial puede orientar un tratamiento, pero nunca es confiable.
      if (!estable) expect(r.confiable).toBe(false);
    }
    expect(evaluar(lectura, { origen: 'corriente', olor: 'normal', visual: 'limpia' }, null).confiable).toBe(
      false,
    );
    expect(
      evaluar(
        { ...lectura, recibidaEn: 3000 },
        { origen: 'corriente', olor: 'normal', visual: 'limpia' },
        calibracion,
      ).confiable,
    ).toBe(false);
  });
  it('decisión W3 (2026-11-08): sólidos por encima de 1000 ppm nunca son confiables ni tratables', () => {
    const o = { origen: 'corriente', olor: 'normal', visual: 'limpia' } as const;
    for (const tds of [1001, 1200, 1499, 1500, 2000]) {
      const r = evaluar({ ...lectura, tds }, o, calibracion);
      expect(r.confiable).toBe(false);
      expect(r.plan).toBe('alternativa');
    }
    expect(evaluar({ ...lectura, tds: 1000 }, o, calibracion).reglas).not.toContain('R17');
  });
  it('decisión P6 (2026-11-08): un equipo sin línea VER (VER:0) se acepta como confiable', () => {
    const r = evaluar(
      { ...lectura, versionProtocolo: 0 },
      { origen: 'corriente', olor: 'normal', visual: 'limpia' },
      calibracion,
    );
    expect(r.confiable).toBe(true);
  });
});

describe('orientación para cada uso', () => {
  it('ningún uso distinto de beber, cocinar o utensilios recibe un tratamiento casero', () => {
    const favorable = evaluar(
      lectura,
      { origen: 'corriente', olor: 'normal', visual: 'limpia' },
      calibracion,
    );
    expect(favorable.plan).toBe('hervido');
    for (const uso of usos) {
      const guia = orientarUso(favorable, uso);
      expect(guia.estado.length).toBeGreaterThan(0);
      if (uso === 'beber' || uso === 'cocinar' || uso === 'utensilios')
        expect(guia.pasos.join(' ')).toMatch(/hirviendo/);
      else expect(guia.pasos.join(' ')).toMatch(/no confirma|No uses esta lectura/i);
    }
    expect(orientarUso(favorable, 'ganado').estado).toBe(favorable.destinos.animal);
    expect(orientarUso(favorable, 'cultivo').estado).toBe(favorable.destinos.riego);
    expect(orientarUso(favorable, 'ropa').estado).toBe(favorable.destinos.ropa);
  });
});
