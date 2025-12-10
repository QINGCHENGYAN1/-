import React from 'react';
import { FolderIcon, GlobeIcon, CloudIcon, CogIcon, MusicNoteIcon, HomeIcon, SearchIcon, HeartIcon, PlusIcon, TrashIcon, EditIcon } from './Icons';
import { t } from '../services/i18n';
import { Language, Playlist } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  lang: Language;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  onRenamePlaylist: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    activeTab, 
    onTabChange, 
    lang, 
    playlists = [], 
    onCreatePlaylist,
    onDeletePlaylist,
    onRenamePlaylist
}) => {
  const menuItems = [
    { id: 'home', label: t('menu.home', lang), icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'search', label: t('menu.search', lang), icon: <SearchIcon className="w-5 h-5" /> },
    { id: 'favorites', label: t('menu.favorites', lang), icon: <HeartIcon className="w-5 h-5" /> },
    { id: 'local', label: t('menu.localMusic', lang), icon: <FolderIcon className="w-5 h-5" /> },
    { id: 'online', label: t('menu.onlineMusic', lang), icon: <GlobeIcon className="w-5 h-5" /> },
    { id: 'cloud', label: t('menu.cloud', lang), icon: <CloudIcon className="w-5 h-5" /> },
    { id: 'settings', label: t('menu.settings', lang), icon: <CogIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="w-60 bg-zinc-900 h-full flex flex-col border-r border-zinc-800 flex-shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-zinc-800">
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
            <MusicNoteIcon className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Muze</h1>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <div className="pt-6 px-3">
          <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('playlist.title', lang)}</p>
              <button 
                onClick={onCreatePlaylist} 
                className="text-zinc-500 hover:text-white transition" 
                title={t('playlist.create', lang)}
              >
                  <PlusIcon className="w-4 h-4" />
              </button>
          </div>
          
          <div className="space-y-1">
             {playlists.map(playlist => {
                 const tabId = `playlist_${playlist.id}`;
                 return (
                    <div 
                        key={playlist.id} 
                        className={`group w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors ${activeTab === tabId ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                    >
                        <button 
                            className="flex-1 text-left truncate mr-2"
                            onClick={() => onTabChange(tabId)}
                        >
                            {playlist.name}
                        </button>
                        <div className="hidden group-hover:flex items-center space-x-1">
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRenamePlaylist(playlist.id); }} 
                                className="text-zinc-500 hover:text-white p-1"
                                title="Rename"
                            >
                                <EditIcon className="w-3 h-3 pointer-events-none" />
                            </button>
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeletePlaylist(playlist.id); }} 
                                className="text-zinc-500 hover:text-red-500 p-1"
                                title="Delete"
                            >
                                <TrashIcon className="w-3 h-3 pointer-events-none" />
                            </button>
                        </div>
                    </div>
                 );
             })}
          </div>
        </div>
      </nav>
    </div>
  );
};