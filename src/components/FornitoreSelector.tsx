import React, { useState, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers';

interface FornitoreSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function FornitoreSelector({ 
  value, 
  onChange, 
  required = false, 
  className = "",
  placeholder = "Seleziona fornitore"
}: FornitoreSelectorProps) {
  const { suppliers, addSupplier, refreshSuppliers } = useSuppliers();
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    nome: '',
    email: '',
    telefono: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const ADD_NEW_VALUE = '__ADD_NEW__';

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === ADD_NEW_VALUE) {
      setShowAddNew(true);
      setNewSupplierName('');
      setError('');
    } else {
      setShowAddNew(false);
      onChange(selectedValue);
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplierData.nome.trim()) {
      setError('Nome fornitore obbligatorio');
      return;
    }

    if (!newSupplierData.email.trim()) {
      setError('Email obbligatoria');
      return;
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSupplierData.email)) {
      setError('Email non valida. Deve contenere @ e un dominio valido.');
      return;
    }

    if (!newSupplierData.telefono.trim()) {
      setError('Numero WhatsApp obbligatorio');
      return;
    }

    // Validazione WhatsApp (deve iniziare con numero e avere almeno 9 cifre)
    const phoneRegex = /^\d{9,}$/;
    if (!phoneRegex.test(newSupplierData.telefono.replace(/\s+/g, ''))) {
      setError('Numero WhatsApp non valido. Deve contenere almeno 9 cifre.');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      console.log('🔄 Aggiunta nuovo fornitore:', newSupplierData);

      const success = await addSupplier(
        newSupplierData.nome.trim().toUpperCase(),
        newSupplierData.email.trim(),
        newSupplierData.telefono.trim()
      );

      if (success) {
        console.log('✅ Fornitore aggiunto con successo');

        // Aggiorna la lista fornitori
        await refreshSuppliers();

        // Seleziona automaticamente il nuovo fornitore
        onChange(newSupplierData.nome.trim().toUpperCase());

        // Reset stato
        setShowAddNew(false);
        setNewSupplierData({ nome: '', email: '', telefono: '' });
      } else {
        setError('Impossibile aggiungere il fornitore. Potrebbe già esistere.');
      }
    } catch (err) {
      console.error('❌ Errore nell\'aggiunta del fornitore:', err);
      setError('Errore durante l\'aggiunta del fornitore');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddNew(false);
    setNewSupplierData({ nome: '', email: '', telefono: '' });
    setError('');
    // Reset select to empty value
    onChange('');
  };

  return (
    <div className="space-y-2">
      {!showAddNew ? (
        <div className="relative">
        <select
          value={value}
          onChange={(e) => handleSelectChange(e.target.value)}
          className={`w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${className}`}
          required={required}
        >
          <option value="">{placeholder}</option>

          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.nome}>
              {supplier.nome}
            </option>
          ))}

          <option 
                    value={ADD_NEW_VALUE} 
                    className="bg-amber-600/20 text-amber-300 font-medium"
                  >
                    ➕ Aggiungi nuovo fornitore
                  </option>
                </select>
                {/* Icona dropdown */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
        </div>
      ) : (
        <div className="space-y-3 p-4 bg-amber-950/20 border border-amber-600/30 rounded-lg">
          <div className="flex items-center gap-2 text-white font-medium">
            <Plus className="h-4 w-4" />
            <span>Nuovo Fornitore</span>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/20 border border-red-500/30 rounded p-2">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Nome Fornitore *
              </label>
              <input
                type="text"
                value={newSupplierData.nome}
                onChange={(e) => setNewSupplierData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                placeholder="NOME FORNITORE"
                className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase"
                disabled={isAdding}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Email Fornitore *
              </label>
              <input
                type="email"
                value={newSupplierData.email}
                onChange={(e) => setNewSupplierData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@fornitore.com"
                className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                disabled={isAdding}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Numero WhatsApp *
              </label>
              <input
                type="tel"
                value={newSupplierData.telefono}
                onChange={(e) => setNewSupplierData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="3391234567"
                className="w-full p-3 bg-black/30 border border-amber-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                disabled={isAdding}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddSupplier}
                disabled={isAdding || !newSupplierData.nome.trim() || !newSupplierData.email.trim() || !newSupplierData.telefono.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isAdding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Salva
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelAdd}
                disabled={isAdding}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}