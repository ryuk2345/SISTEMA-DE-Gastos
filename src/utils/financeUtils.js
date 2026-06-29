/**
 * Normaliza un monto ingresado como string (acepta punto y coma, elimina espacios).
 * Retorna un float redondeado a 2 decimales o lanza un error si es inválido.
 */
export function normalizarMonto(input) {
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0) throw new Error("Monto inválido");
    return Math.round(input * 100) / 100;
  }
  
  if (!input || typeof input !== 'string') throw new Error("Monto inválido");
  
  let limpio = input.trim();
  // Reemplazar coma decimal por punto. Si hay comas de miles y punto decimal (ej: 1,500.50),
  // se remueven primero las comas de miles.
  if (limpio.includes(',') && limpio.includes('.')) {
    // Si la coma está antes del punto, es separador de miles.
    if (limpio.indexOf(',') < limpio.indexOf('.')) {
      limpio = limpio.replace(/,/g, '');
    } else {
      // De lo contrario (ej: 1.500,50), el punto es de miles y la coma es decimal.
      limpio = limpio.replace(/\./g, '').replace(',', '.');
    }
  } else if (limpio.includes(',')) {
    // Si solo tiene coma, asumimos que es el separador decimal (ej: 46,17 o 1,500)
    // A menos que parezca miles (ej: 1,000 -> 1000). Evaluamos si tiene 3 dígitos después de la coma.
    const parts = limpio.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parseFloat(parts[0]) > 0) {
      limpio = limpio.replace(',', ''); // separador de miles
    } else {
      limpio = limpio.replace(',', '.'); // separador decimal
    }
  }

  const valor = parseFloat(limpio);
  if (isNaN(valor) || valor <= 0) throw new Error("Monto inválido");
  
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula el estado del semáforo acumulado clásico para una categoría.
 */
export function calcularSemafaroAcumulado(gastado, presupuesto, umbralAmarillo = 90, umbralRojo = 100) {
  const disponible = presupuesto - gastado;
  
  if (presupuesto <= 0) {
    return {
      porcentajeUsado: 0,
      disponible: 0,
      estado: 'ok',
      color: 'green',
      label: 'Sin presupuesto'
    };
  }

  const porcentajeUsado = (gastado / presupuesto) * 100;
  
  let estado = 'ok';
  let color = 'green';
  let label = '🟢 OK';

  if (porcentajeUsado >= umbralRojo) {
    estado = 'excedido';
    color = 'red';
    label = '🔴 Excedido';
  } else if (porcentajeUsado >= umbralAmarillo) {
    estado = 'cuidado';
    color = 'yellow';
    label = '🟡 Cuidado';
  }

  return {
    porcentajeUsado: Math.round(porcentajeUsado * 100) / 100,
    disponible: Math.round(disponible * 100) / 100,
    estado,
    color,
    label
  };
}

export function getDiasCalendario(fechaStr) {
  let targetDate;
  let useSpecificDay = false;
  
  if (fechaStr) {
    if (fechaStr.length === 7) {
      // YYYY-MM
      targetDate = new Date(fechaStr + '-01T12:00:00');
    } else {
      // YYYY-MM-DD
      targetDate = new Date(fechaStr + 'T12:00:00');
      useSpecificDay = true;
    }
  } else {
    targetDate = new Date();
  }
  
  const anio = targetDate.getFullYear();
  const mes = targetDate.getMonth();
  const diasTotales = new Date(anio, mes + 1, 0).getDate();
  
  const hoyReal = new Date();
  const esMesCurso = hoyReal.getFullYear() === anio && hoyReal.getMonth() === mes;
  
  let diasTranscurridos = diasTotales;
  
  if (useSpecificDay) {
    diasTranscurridos = targetDate.getDate();
  } else if (esMesCurso) {
    diasTranscurridos = hoyReal.getDate();
  }
  
  if (diasTranscurridos <= 0) diasTranscurridos = 1;
  if (diasTranscurridos > diasTotales) diasTranscurridos = diasTotales;
  
  return {
    diasTranscurridos,
    diasTotales
  };
}

/**
 * Calcula la velocidad de gasto proyectada al fin de mes.
 */
export function calcularVelocidadGasto(gastado, presupuesto, fechaRef, umbralAmarilloVel = 100, umbralRojoVel = 130) {
  if (presupuesto <= 0) {
    return {
      ritmoDiarioActual: 0,
      gastoProyectadoCierre: 0,
      ratioProyectado: 0,
      nivel: 'sano',
      color: 'green',
      label: '🟢 Ritmo sano'
    };
  }

  const { diasTranscurridos, diasTotales } = getDiasCalendario(fechaRef);
  
  const ritmoDiarioActual = gastado / diasTranscurridos;
  const gastoProyectadoCierre = ritmoDiarioActual * diasTotales;
  const ratioProyectado = (gastoProyectadoCierre / presupuesto) * 100;

  let nivel = 'sano';
  let color = 'green';
  let label = '🟢 Ritmo sano';

  if (ratioProyectado > umbralRojoVel) {
    nivel = 'critico';
    color = 'red';
    label = '🔴 Ritmo crítico';
  } else if (ratioProyectado > umbralAmarilloVel) {
    nivel = 'elevado';
    color = 'yellow';
    label = '🟡 Ritmo elevado';
  }

  return {
    ritmoDiarioActual: Math.round(ritmoDiarioActual * 100) / 100,
    gastoProyectadoCierre: Math.round(gastoProyectadoCierre * 100) / 100,
    ratioProyectado: Math.round(ratioProyectado * 100) / 100,
    nivel,
    color,
    label
  };
}

/**
 * Calcula la comparación mes contra mes anterior (Nivel 1 de Analítica).
 */
export function calcularMoM(gastadoMesActual, gastadoMesAnterior) {
  if (!gastadoMesAnterior || gastadoMesAnterior <= 0) {
    return {
      variacion: 0,
      indicador: '→',
      texto: 'Sin datos previos'
    };
  }

  const variacion = ((gastadoMesActual - gastadoMesAnterior) / gastadoMesAnterior) * 100;
  const diffAbs = Math.abs(Math.round(variacion * 10) / 10);
  
  let indicador = '→';
  let texto = `Igual al mes anterior`;

  if (variacion > 0) {
    indicador = '↑';
    texto = `+${diffAbs}% que el mes anterior`;
  } else if (variacion < 0) {
    indicador = '↓';
    texto = `-${diffAbs}% que el mes anterior`;
  }

  return {
    variacion: Math.round(variacion * 100) / 100,
    indicador,
    texto
  };
}
