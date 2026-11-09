// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest';
import { METODOS, metodosPara, obtenerMetodo, protocolos } from './protocolos';

const texto = (id: string) => JSON.stringify(obtenerMetodo(id));

describe('métodos de desinfección', () => {
  it('hervir es el método por defecto y reutiliza el protocolo de hervido', () => {
    expect(obtenerMetodo(undefined).id).toBe('hervir');
    expect(obtenerMetodo('desconocido').id).toBe('hervir');
    expect(obtenerMetodo('hervir').pasos).toEqual(protocolos.hervido.pasos);
  });

  it('solo hay métodos para el plan de tratamiento', () => {
    expect(metodosPara('hervido').map(m => m.id)).toEqual(['hervir', 'cloro', 'sol']);
    expect(metodosPara('alternativa')).toEqual([]);
    expect(metodosPara('repetir')).toEqual([]);
  });

  it('las cantidades de cloro son exactamente las de CDC', () => {
    const cloro = texto('cloro');
    expect(cloro).toMatch(/5 % al 9 %: 2 gotas por cada litro \(40 gotas para 20 litros\)/);
    expect(cloro).toMatch(/cloro del 1 %: 10 gotas por litro/);
    expect(cloro).toMatch(/usa el doble/);
    expect(cloro).toMatch(/al menos 30 minutos/);
    expect(obtenerMetodo('cloro').pasos.find(p => p.segundos)?.segundos).toBe(1800);
    expect(cloro).toMatch(/sin perfume ni detergente/);
    expect(cloro).toMatch(/no lo uses para beber/);
  });

  it('el sol exige agua clara, 6 horas o 2 días y no sirve con lluvia', () => {
    const sol = texto('sol');
    expect(sol).toMatch(/6 horas/);
    expect(sol).toMatch(/2 días seguidos/);
    expect(sol).toMatch(/lluvia continua/);
    expect(sol).toMatch(/2 litros o menos/);
    expect(obtenerMetodo('sol').pasos.find(p => p.segundos)?.segundos).toBe(21600);
  });

  it('cada método advierte lo que no elimina y cita su fuente', () => {
    for (const m of METODOS) {
      expect(m.limites).toMatch(/toxinas de algas/);
      expect(m.limites).toMatch(/químicos/);
      expect(m.fuentes.length).toBeGreaterThan(0);
      for (const f of m.fuentes) expect(f.url).toMatch(/^https:\/\//);
    }
  });
});
