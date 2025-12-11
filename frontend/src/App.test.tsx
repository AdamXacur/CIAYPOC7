import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('CRAC Frontend Smoke Tests', () => {
  
  it('debe mostrar la pantalla de bienvenida/login inicial', () => {
    render(<App />);
    // Busca el texto del título en la pantalla de login simulada
    expect(screen.getByText(/CRAC/i)).toBeInTheDocument();
    expect(screen.getByText(/Atención Ciudadana/i)).toBeInTheDocument();
  });

  it('debe permitir seleccionar el rol de Ciudadano', () => {
    render(<App />);
    const citizenButton = screen.getByText(/Soy Ciudadano/i);
    fireEvent.click(citizenButton);
    
    // Al hacer clic, debería aparecer el Rastreador Público
    expect(screen.getByText(/Rastreador Ciudadano/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: YUC-2024-001/i)).toBeInTheDocument();
  });

});