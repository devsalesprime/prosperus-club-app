import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DirectoryMember {
  hubspot_id: string;
  full_name: string;
  email: string | null;
  company: string | null;
  app_profile_id: string | null;
}

interface Props {
  value: string; // the selected ID
  onChange: (value: string, appProfileId: string | null, hubspotId: string) => void;
  placeholder?: string;
}

export function SmartMemberSelect({ value, onChange, placeholder = "Buscar sócio por nome ou empresa..." }: Props) {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [filtered, setFiltered] = useState<DirectoryMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Carrega o diretório universal
    const fetchDirectory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('hubspot_directory')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (!error && data) {
        setMembers(data);
      }
      setIsLoading(false);
    };
    fetchDirectory();
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setFiltered(members);
    } else {
      const lowerQuery = query.toLowerCase();
      setFiltered(members.filter(m => 
        m.full_name.toLowerCase().includes(lowerQuery) || 
        (m.company && m.company.toLowerCase().includes(lowerQuery))
      ));
    }
  }, [query, members]);

  useEffect(() => {
    // Update local query text if value changes externally
    if (value && members.length > 0) {
      const matched = members.find(m => m.app_profile_id === value || m.hubspot_id === value);
      if (matched && matched.full_name !== query) {
        setQuery(matched.full_name);
      }
    }
  }, [value, members]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query to the selected value if the user didn't make a valid selection
        if (value) {
            const matched = members.find(m => m.app_profile_id === value || m.hubspot_id === value);
            if (matched) setQuery(matched.full_name);
        } else {
            setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, members]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-[#0f172a] border border-gray-700 text-white rounded-lg block w-full pl-10 p-2.5 focus:border-amber-500 focus:ring-amber-500"
          placeholder={isLoading ? "Carregando diretório..." : placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
               onChange('', null, '');
            }
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#1e293b] border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-400 text-center">Nenhum sócio encontrado.</div>
          ) : (
            filtered.map((member) => (
              <div
                key={member.hubspot_id}
                className="p-3 hover:bg-[#334155] cursor-pointer border-b border-gray-700/50 last:border-0"
                onClick={() => {
                  setQuery(member.full_name);
                  setIsOpen(false);
                  onChange(member.app_profile_id || member.hubspot_id, member.app_profile_id, member.hubspot_id);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{member.full_name}</div>
                    {(member.company || member.email) && (
                      <div className="text-xs text-gray-400 mt-1">
                        {member.company ? `${member.company}` : member.email}
                      </div>
                    )}
                  </div>
                  <div>
                    {member.app_profile_id ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Sócio no App
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Offline CRM
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
