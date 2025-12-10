import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { EQPanel } from './components/EQPanel';
import { LoginDialog } from './components/LoginDialog';
import { Visualizer } from './components/Visualizer';
import { LyricsOverlay } from './components/LyricsOverlay';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { Song, MusicSource, EqualizerBand, UserSettings, RemoteStorageProvider, VisualizerMode, Playlist } from './types';
import { searchOnlineSongs, getRecommendedPlaylists, MockCloudProvider, BaiduCloudProvider, SMBNasProvider } from './services/mockServices';
import { t } from './services/i18n';
import { PlayIcon, PauseIcon, MusicNoteIcon, SearchIcon, FolderIcon, CloudIcon, GlobeIcon, WaveIcon, HeartIcon, TrashIcon, PlusCircleIcon, XMarkIcon } from './components/Icons';

// --- Sub-components for Views ---

// Shared Song List Component
const SongList = ({ 
    songs, 
    onPlay, 
    onCycleVisualizer,
    vizMode,
    likedSongIds,
    onToggleLike,
    onDelete,
    onAdd 
}: { 
    songs: Song[], 
    onPlay: (s: Song) => void,
    onCycleVisualizer: () => void,
    vizMode: VisualizerMode,
    likedSongIds: Set<string>,
    onToggleLike: (s: Song) => void,
    onDelete?: (s: Song) => void,
    onAdd?: (s: Song) => void
}) => (
  <table className="w-full text-left border-collapse table-fixed">
    <thead>
      <tr className="text-zinc-500 text-xs border-b border-zinc-800">
        <th className="py-3 pl-2 w-10">#</th>
        <th className="py-3 w-16">Cover</th>
        <th className="py-3 w-10"></th> {/* Like Column */}
        <th className="py-3 w-1/4">Title</th>
        <th className="py-3 w-1/4">Artist</th>
        <th className="py-3 w-1/4">Album</th>
        <th className="py-3 text-right pr-4 w-20">Duration</th>
        {onAdd && <th className="py-3 w-10"></th>} {/* Add to Playlist Column */}
        {onDelete && <th className="py-3 w-10"></th>} {/* Delete Column */}
      </tr>
    </thead>
    <tbody>
      {songs.map((song, idx) => {
        const isLiked = likedSongIds.has(song.id);
        return (
            <tr 
                key={song.id} 
                className="group hover:bg-zinc-800/50 transition-colors cursor-default text-sm text-zinc-400 hover:text-white"
            >
            <td className="py-3 pl-2 group-hover:text-white truncate">{idx + 1}</td>
            
            {/* Cover Column */}
            <td className="py-2">
                <div className="w-10 h-10 relative rounded overflow-hidden group/cover shrink-0">
                    {song.coverUrl ? (
                        <img src={song.coverUrl} alt="cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                            <MusicNoteIcon className="w-5 h-5 text-zinc-500" />
                        </div>
                    )}
                    
                    {/* Overlay for Visualizer Toggle */}
                    <div className="absolute inset-0 bg-black/60 hidden group-hover/cover:flex items-center justify-center cursor-pointer transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCycleVisualizer();
                        }}
                        title="Click to cycle Visualizer Effect"
                    >
                        <WaveIcon className="w-5 h-5 text-red-500 pointer-events-none" />
                    </div>
                </div>
            </td>

            {/* Like Column */}
            <td className="py-3 text-center">
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleLike(song); }}
                    className={`hover:scale-110 transition ${isLiked ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}
                >
                    <HeartIcon className="w-5 h-5 pointer-events-none" filled={isLiked} />
                </button>
            </td>

            <td className="py-3 font-medium text-white cursor-pointer truncate pr-2" onDoubleClick={() => onPlay(song)}>{song.title}</td>
            <td className="py-3 cursor-pointer truncate pr-2" onDoubleClick={() => onPlay(song)}>{song.artist}</td>
            <td className="py-3 cursor-pointer truncate pr-2" onDoubleClick={() => onPlay(song)}>{song.album}</td>
            <td className="py-3 text-right pr-4 font-mono truncate">
                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </td>

            {/* Add to Playlist Column */}
            {onAdd && (
                <td className="py-3 text-center">
                    <button 
                        type="button"
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            onAdd(song); 
                        }}
                        className="text-zinc-500 hover:text-white transition opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-zinc-700 focus:outline-none"
                        title="Add to Playlist"
                    >
                        <PlusCircleIcon className="w-5 h-5 pointer-events-none" />
                    </button>
                </td>
            )}

            {/* Delete Column */}
            {onDelete && (
                <td className="py-3 text-center">
                    <button 
                        type="button"
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(song); 
                        }}
                        className="text-zinc-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-zinc-700 focus:outline-none"
                        title="Remove"
                    >
                        <TrashIcon className="w-5 h-5 pointer-events-none" />
                    </button>
                </td>
            )}
            </tr>
        );
      })}
    </tbody>
  </table>
);

// User Playlist View
const UserPlaylistView = ({
    playlist,
    onPlay,
    lang,
    onCycleVisualizer,
    vizMode,
    likedSongIds,
    onToggleLike,
    onRemoveSong,
    onAdd 
}: {
    playlist: Playlist,
    onPlay: (s: Song, queue: Song[]) => void,
    lang: 'en' | 'zh',
    onCycleVisualizer: () => void,
    vizMode: VisualizerMode,
    likedSongIds: Set<string>,
    onToggleLike: (s: Song) => void,
    onRemoveSong: (s: Song) => void,
    onAdd?: (s: Song) => void
}) => (
    <div className="p-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center">
                <MusicNoteIcon className="w-8 h-8 mr-3 text-blue-500" />
                {playlist.name}
            </h2>
            <div className="text-zinc-500 text-sm">{playlist.songs.length} Songs</div>
        </div>

        {playlist.songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/30">
                <MusicNoteIcon className="w-16 h-16 text-zinc-700 mb-4" />
                <p className="text-zinc-500">This playlist is empty.</p>
                <p className="text-zinc-600 text-sm mt-2">Add songs from Local, Online or Cloud tabs.</p>
            </div>
        ) : (
            <SongList 
                songs={playlist.songs} 
                onPlay={(s) => onPlay(s, playlist.songs)} 
                onCycleVisualizer={onCycleVisualizer} 
                vizMode={vizMode} 
                likedSongIds={likedSongIds} 
                onToggleLike={onToggleLike} 
                onDelete={onRemoveSong} // Maps to onDelete
                onAdd={onAdd}
            />
        )}
    </div>
);

// 0. Home View (Dashboard)
const HomeView = ({
    onPlay,
    lang,
    localSongs,
    cloudFiles,
    cloudProviderName,
    onCycleVisualizer,
    vizMode,
    likedSongIds,
    onToggleLike,
    likedSongs,
    mostPlayed,
    onNavigate,
    currentSong,
    isPlaying,
    onPlayPause,
    onDeleteLocal, 
    onDeleteCloud, 
    onSearch,
    onAdd       
}: {
    onPlay: (s: Song, queue: Song[]) => void, 
    lang: 'en' | 'zh',
    localSongs: Song[],
    cloudFiles: Song[],
    cloudProviderName?: string,
    onCycleVisualizer: () => void,
    vizMode: VisualizerMode,
    likedSongIds: Set<string>,
    onToggleLike: (s: Song) => void,
    likedSongs: Song[],
    mostPlayed: Song[],
    onNavigate: (view: string) => void,
    currentSong: Song | null,
    isPlaying: boolean,
    onPlayPause: () => void,
    onDeleteLocal: (s: Song) => void,
    onDeleteCloud: (s: Song) => void,
    onSearch: (query: string) => void,
    onAdd: (s: Song) => void
}) => {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [defaultOnlineSongId, setDefaultOnlineSongId] = useState<string | null>(null);

    useEffect(() => {
        getRecommendedPlaylists().then(setPlaylists);
        searchOnlineSongs('').then(songs => {
            if (songs.length > 0) setDefaultOnlineSongId(songs[0].id);
        });
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchKeyword.trim()) {
            onSearch(searchKeyword);
        }
    };

    // Construct Display Playlists (Inject Favorites and Most Played)
    const displayPlaylists = [
        {
            id: 'my_favorites',
            title: t('favorites.title', lang),
            cover: likedSongs.length > 0 ? likedSongs[0].coverUrl : null,
            songs: likedSongs,
            isSpecial: true,
            icon: <HeartIcon className="w-8 h-8 text-white drop-shadow-lg" filled />
        },
        {
            id: 'my_most_played',
            title: t('online.mostPlayed', lang),
            cover: mostPlayed.length > 0 ? mostPlayed[0].coverUrl : null,
            songs: mostPlayed,
            isSpecial: true,
            icon: <MusicNoteIcon className="w-8 h-8 text-white drop-shadow-lg" />
        },
        ...playlists
    ];

    const handlePlayPlaylist = (pl: any) => {
        const songsToPlay = pl.songs || []; 
        if (songsToPlay.length > 0) {
            onPlay(songsToPlay[0], songsToPlay);
        } else {
            searchOnlineSongs('').then(songs => {
                 onPlay(songs[0], songs);
            });
        }
    };

    const handleCardClick = (pl: any) => {
        if (pl.id === 'my_favorites') {
            onNavigate('favorites');
        } else if (pl.id === 'my_most_played') {
            onNavigate('most_played');
        } else {
            // For standard playlists, currently we just play them
            handlePlayPlaylist(pl);
        }
    };

    const isPlaylistActive = (pl: any) => {
        if (!currentSong) return false;
        if (pl.songs && pl.songs.length > 0) {
            return pl.songs.some((s: Song) => s.id === currentSong.id);
        }
        if (defaultOnlineSongId) {
            return currentSong.id === defaultOnlineSongId;
        }
        return false;
    };

    const handleToggleCard = (e: React.MouseEvent, pl: any) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isPlaylistActive(pl)) {
            onPlayPause();
        } else {
            handlePlayPlaylist(pl);
        }
    };

    return (
        <div className="p-8 space-y-8 relative z-10">
            {/* Main Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-zinc-800 border border-zinc-700 rounded-full text-white placeholder-zinc-400 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none shadow-xl transition-all"
                    placeholder={t('online.searchPlaceholder', lang)}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                />
            </form>

            <>
                {/* Recommended Playlists Grid (Inc. Favorites & Most Played) */}
                <section>
                    <h3 className="text-xl font-bold text-white mb-4">{t('online.recommend', lang)}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {displayPlaylists.map(pl => {
                            const active = isPlaylistActive(pl);
                            const playing = active && isPlaying;
                            return (
                            <div key={pl.id} className="group cursor-pointer" onClick={() => handleCardClick(pl)}>
                                <div className={`aspect-square bg-zinc-800 rounded-lg overflow-hidden relative mb-2 shadow-lg ${pl.isSpecial ? 'border-2 border-zinc-700' : ''}`}>
                                    {pl.cover ? (
                                        <img src={pl.cover} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${pl.isSpecial ? 'bg-gradient-to-br from-zinc-800 to-zinc-700' : 'bg-zinc-800'}`}>
                                            {pl.isSpecial ? pl.icon : <MusicNoteIcon className="w-10 h-10 text-zinc-600" />}
                                        </div>
                                    )}
                                    
                                    {/* Overlay with Play/Pause Button */}
                                    <div className={`absolute inset-0 bg-black/20 transition flex items-center justify-center backdrop-blur-[2px] ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <div 
                                            className="w-12 h-12 bg-red-600/90 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition cursor-pointer z-20"
                                            onClick={(e) => handleToggleCard(e, pl)}
                                        >
                                            {playing ? (
                                                <PauseIcon className="w-6 h-6 text-white pointer-events-none" />
                                            ) : (
                                                <PlayIcon className="w-6 h-6 text-white ml-1 pointer-events-none" />
                                            )}
                                        </div>
                                    </div>

                                    {pl.isSpecial && (
                                        <div className="absolute top-2 right-2">
                                            {pl.id === 'my_favorites' ? <HeartIcon className="w-5 h-5 text-red-500 filter drop-shadow-md" filled /> : null}
                                        </div>
                                    )}
                                    {pl.isSpecial && (
                                        <div className="absolute bottom-2 left-2 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded">
                                            {pl.songs ? pl.songs.length : 0} Songs
                                        </div>
                                    )}
                                </div>
                                <p className={`text-sm font-medium truncate ${pl.isSpecial ? 'text-red-400' : 'text-white'}`}>{pl.title}</p>
                            </div>
                            );
                        })}
                    </div>
                </section>

                {/* Local Music Quick Access */}
                <section>
                    <div className="flex justify-between items-end mb-4 border-b border-zinc-800 pb-2">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <FolderIcon className="w-5 h-5 mr-2 text-red-500" />
                            {t('menu.localMusic', lang)}
                        </h3>
                        {localSongs.length > 0 && <span className="text-xs text-zinc-500 mb-1">Recent 5 songs</span>}
                    </div>
                    {localSongs.length === 0 ? (
                        <div className="text-zinc-500 text-sm py-4">{t('local.empty', lang)}</div>
                    ) : (
                        <SongList 
                            songs={localSongs.slice(0, 5)} 
                            onPlay={(s) => onPlay(s, localSongs)} 
                            onCycleVisualizer={onCycleVisualizer} 
                            vizMode={vizMode} 
                            likedSongIds={likedSongIds} 
                            onToggleLike={onToggleLike}
                            onDelete={onDeleteLocal}
                            onAdd={onAdd}
                        />
                    )}
                </section>

                {/* Cloud / NAS Quick Access */}
                <section>
                    <div className="flex justify-between items-end mb-4 border-b border-zinc-800 pb-2">
                        <h3 className="text-xl font-bold text-white flex items-center">
                            <CloudIcon className="w-5 h-5 mr-2 text-green-500" />
                            {t('menu.cloud', lang)}
                            {cloudProviderName && <span className="ml-2 text-sm text-zinc-400 font-normal">({cloudProviderName})</span>}
                        </h3>
                        {cloudFiles.length > 0 && <span className="text-xs text-zinc-500 mb-1">Recent 5 files</span>}
                    </div>
                    {cloudFiles.length === 0 ? (
                        <div className="text-zinc-500 text-sm py-4 flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/30">
                            <CloudIcon className="w-8 h-8 text-zinc-600 mb-2" />
                            <p>{cloudProviderName ? 'Folder is empty' : 'No cloud source connected'}</p>
                            {!cloudProviderName && (
                                <button onClick={() => onNavigate('cloud')} className="mt-2 text-red-400 hover:text-red-300 text-xs">
                                    Go to Cloud Tab
                                </button>
                            )}
                        </div>
                    ) : (
                        <SongList 
                            songs={cloudFiles.slice(0, 5)} 
                            onPlay={(s) => onPlay(s, cloudFiles)} 
                            onCycleVisualizer={onCycleVisualizer} 
                            vizMode={vizMode} 
                            likedSongIds={likedSongIds} 
                            onToggleLike={onToggleLike}
                            onDelete={onDeleteCloud}
                            onAdd={onAdd}
                        />
                    )}
                </section>
            </>
        </div>
    );
};

// Search View
const SearchView = ({
    onPlay,
    lang,
    localSongs,
    cloudFiles,
    onCycleVisualizer,
    vizMode,
    likedSongIds,
    onToggleLike,
    onDeleteLocal,
    onDeleteCloud,
    initialQuery,
    onAdd // New
}: {
    onPlay: (s: Song, queue: Song[]) => void, 
    lang: 'en' | 'zh',
    localSongs: Song[],
    cloudFiles: Song[],
    onCycleVisualizer: () => void,
    vizMode: VisualizerMode,
    likedSongIds: Set<string>,
    onToggleLike: (s: Song) => void,
    onDeleteLocal: (s: Song) => void,
    onDeleteCloud: (s: Song) => void,
    initialQuery: string,
    onAdd: (s: Song) => void
}) => {
    const [keyword, setKeyword] = useState(initialQuery);
    const [results, setResults] = useState<{online: Song[], local: Song[], cloud: Song[]}>({online: [], local: [], cloud: []});
    const [isSearching, setIsSearching] = useState(false);

    const performSearch = async (q: string) => {
        if (!q.trim()) return;
        setIsSearching(true);
        
        const lower = q.toLowerCase();
        await new Promise(r => setTimeout(r, 300));

        const local = localSongs.filter(s => s.title.toLowerCase().includes(lower) || s.artist.toLowerCase().includes(lower));
        const cloud = cloudFiles.filter(s => s.title.toLowerCase().includes(lower) || s.artist.toLowerCase().includes(lower));
        const online = await searchOnlineSongs(q);

        setResults({ local, cloud, online });
        setIsSearching(false);
    };

    useEffect(() => {
        if (initialQuery) {
            setKeyword(initialQuery);
            performSearch(initialQuery);
        } else {
            searchOnlineSongs('').then((online) => setResults(prev => ({ ...prev, online })));
        }
    }, [initialQuery]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(keyword);
    };

    return (
        <div className="p-8 space-y-8 relative z-10 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-2">{t('menu.search', lang)}</h2>
            
            <form onSubmit={handleSearch} className="flex gap-4">
                <input 
                    type="text" 
                    placeholder={t('online.searchPlaceholder', lang)} 
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-3 px-6 text-white focus:ring-2 focus:ring-red-600 outline-none"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    autoFocus
                />
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-8 rounded-lg font-medium transition">
                    {t('common.search', lang)}
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-8">
                {isSearching ? (
                     <div className="text-center text-zinc-500 py-20">Searching...</div>
                ) : (
                    <>
                        {results.local.length > 0 && (
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><FolderIcon className="w-5 h-5 mr-2 text-red-500"/> {t('menu.localMusic', lang)}</h3>
                                <SongList songs={results.local} onPlay={(s) => onPlay(s, results.local)} onCycleVisualizer={onCycleVisualizer} vizMode={vizMode} likedSongIds={likedSongIds} onToggleLike={onToggleLike} onDelete={onDeleteLocal} onAdd={onAdd}/>
                            </section>
                        )}
                        {results.online.length > 0 && (
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><GlobeIcon className="w-5 h-5 mr-2 text-blue-500"/> {t('menu.onlineMusic', lang)}</h3>
                                <SongList songs={results.online} onPlay={(s) => onPlay(s, results.online)} onCycleVisualizer={onCycleVisualizer} vizMode={vizMode} likedSongIds={likedSongIds} onToggleLike={onToggleLike} onAdd={onAdd}/>
                            </section>
                        )}
                        {results.cloud.length > 0 && (
                            <section>
                                 <h3 className="text-xl font-bold text-white mb-4 flex items-center"><CloudIcon className="w-5 h-5 mr-2 text-green-500"/> {t('menu.cloud', lang)}</h3>
                                <SongList songs={results.cloud} onPlay={(s) => onPlay(s, results.cloud)} onCycleVisualizer={onCycleVisualizer} vizMode={vizMode} likedSongIds={likedSongIds} onToggleLike={onToggleLike} onDelete={onDeleteCloud} onAdd={onAdd}/>
                            </section>
                        )}
                        
                        {!isSearching && keyword && results.local.length === 0 && results.online.length === 0 && results.cloud.length === 0 && (
                             <div className="text-center text-zinc-600 py-20">
                                 <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-20"/>
                                 <p>No results found for "{keyword}"</p>
                             </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// Local Music View
const LocalMusicView = ({ 
    songs, 
    onAddFolder, 
    onPlay, 
    lang,
    onCycleVisualizer,
    vizMode,
    likedSongIds,
    onToggleLike,
    onDelete,
    onAdd
}: { 
    songs: Song[], 
    onAddFolder: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    onPlay: (song: Song, queue: Song[]) => void,
    lang: 'en' | 'zh',
    onCycleVisualizer: () => void,
    vizMode: VisualizerMode,
    likedSongIds: Set<string>,
    onToggleLike: (s: Song) => void,
    onDelete: (s: Song) => void,
    onAdd: (s: Song) => void
}) => (
  <div className="p-8 relative z-10">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-white">{t('menu.localMusic', lang)}</h2>
      <div className="relative">
        <label className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded cursor-pointer transition flex items-center shadow-lg shadow-red-900/20">
            <span>{t('local.addFolder', lang)}</span>
            <input 
                type="file" 
                multiple 
                /* @ts-ignore */
                webkitdirectory="" 
                directory=""
                className="hidden" 
                onChange={onAddFolder} 
            />
        </label>
      </div>
    </div>
    
    {songs.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/30">
        <MusicNoteIcon className="w-16 h-16 text-zinc-600 mb-4" />
        <p className="text-zinc-500">{t('local.empty', lang)}</p>
      </div>
    ) : (
      <SongList songs={songs} onPlay={(s) => onPlay(s, songs)} onCycleVisualizer={onCycleVisualizer} vizMode={vizMode} likedSongIds={likedSongIds} onToggleLike={onToggleLike} onDelete={onDelete} onAdd={onAdd}/>
    )}
  </div>
);

// Online Music View
const OnlineMusicView = ({ onPlay, lang, onCycleVisualizer, vizMode, likedSongIds, onToggleLike, onAdd }: { onPlay: (s: Song, queue: Song[]) => void, lang: 'en' | 'zh', onCycleVisualizer: () => void, vizMode: VisualizerMode, likedSongIds: Set<string>, onToggleLike: (s: Song) => void, onAdd: (s: Song) => void }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    // Initial load
    searchOnlineSongs('').then(setResults);
    getRecommendedPlaylists().then(setPlaylists);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await searchOnlineSongs(keyword);
    setResults(res);
  };

  return (
    <div className="p-8 space-y-8 relative z-10">
      <div className="flex items-center space-x-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
            <input 
                type="text" 
                placeholder={t('online.searchPlaceholder', lang)} 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-3 px-6 text-white focus:ring-2 focus:ring-red-600 outline-none"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
            />
        </form>
      </div>

      {!keyword && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{t('online.recommend', lang)}</h3>
            <div className="grid grid-cols-4 gap-6">
                {playlists.map(pl => (
                    <div key={pl.id} className="group cursor-pointer">
                        <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden relative mb-2 shadow-lg">
                            <img src={pl.cover} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                                    <PlayIcon className="w-6 h-6 text-red-600 ml-1" />
                                </div>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{pl.title}</p>
                    </div>
                ))}
            </div>
          </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-white mb-4">{keyword ? `Search Results` : `New Releases`}</h3>
        <SongList songs={results} onPlay={(s) => onPlay(s, results)} onCycleVisualizer={onCycleVisualizer} vizMode={vizMode} likedSongIds={likedSongIds} onToggleLike={onToggleLike} onAdd={onAdd}/>
      </div>
    </div>
  );
};

// Cloud / NAS View
const CloudNasView = ({ 
  providers, 
  onAddProvider, 
  onSelectProvider, 
  selectedProvider, 
  files,
  onPlay,
  lang,
  onCycleVisualizer,
  vizMode,
  likedSongIds,
  onToggleLike,
  onDelete,
  onAdd
}: {
  providers: RemoteStorageProvider[],
  onAddProvider: () => void,
  onSelectProvider: (p: RemoteStorageProvider) => void,
  selectedProvider: RemoteStorageProvider | null,
  files: Song[],
  onPlay: (s: Song, queue: Song[]) => void,
  lang: 'en' | 'zh',
  onCycleVisualizer: () => void,
  vizMode: VisualizerMode,
  likedSongIds: Set<string>,
  onToggleLike: (s: Song) => void,
  onDelete: (s: Song) => void,
  onAdd: (s: Song) => void
}) => (
  <div className="p-8 h-full flex flex-col relative z-10">
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">{t('menu.cloud', lang)}</h2>
        <button onClick={onAddProvider} className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded border border-zinc-700">
            + {t('cloud.addSource', lang)}
        </button>
    </div>

    <div className="flex h-full space-x-6">
        <div className="w-1/3 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 space-y-2 backdrop-blur-sm">
            {providers.map(p => (
                <div 
                    key={p.id} 
                    onClick={() => onSelectProvider(p)}
                    className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group border border-transparent ${selectedProvider?.id === p.id ? 'bg-zinc-800 border-zinc-700' : 'hover:bg-zinc-800'}`}
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-xs text-zinc-500">{p.type}</p>
                        </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${p.isLoggedIn ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
                </div>
            ))}
        </div>

        <div className="flex-1 bg-zinc-900/30 rounded-xl p-4 border border-zinc-800 overflow-y-auto backdrop-blur-sm">
            {!selectedProvider ? (
                <div className="h-full flex items-center justify-center text-zinc-500">Select a storage source</div>
            ) : !selectedProvider.isLoggedIn ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                    <p>Login required to access {selectedProvider.name}</p>
                    <button onClick={() => onSelectProvider(selectedProvider)} className="bg-red-600 text-white px-4 py-2 rounded">
                        Login Now
                    </button>
                </div>
            ) : (
                <SongList songs={files} onPlay={(s) => onPlay(s, files)} onCycleVisualizer={onCycleVisualizer} vizMode={vizMode} likedSongIds={likedSongIds} onToggleLike={onToggleLike} onDelete={onDelete} onAdd={onAdd}/>
            )}
        </div>
    </div>
  </div>
);

// Favorites View
const FavoritesView = ({ 
    likedSongs, 
    onPlay, 
    lang,
    onCycleVisualizer,
    vizMode,
    likedSongIds,
    onToggleLike,
    onDelete,
    onAdd
}: { 
    likedSongs: Song[], 
    onPlay: (song: Song, queue: Song[]) => void,
    lang: 'en' | 'zh',
    onCycleVisualizer: () => void,
    vizMode: VisualizerMode,
    likedSongIds: Set<string>,
    onToggleLike: (s: Song) => void,
    onDelete: (s: Song) => void,
    onAdd: (s: Song) => void
}) => (
  <div className="p-8 relative z-10">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-white flex items-center">
          <HeartIcon className="w-8 h-8 mr-3 text-red-500" filled />
          {t('favorites.title', lang)}
      </h2>
      <div className="text-zinc-500 text-sm">{likedSongs.length} Songs</div>
    </div>
    
    {likedSongs.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/30">
        <HeartIcon className="w-16 h-16 text-zinc-700 mb-4" />
        <p className="text-zinc-500">{t('favorites.empty', lang)}</p>
      </div>
    ) : (
      <SongList songs={likedSongs} onPlay={(s) => onPlay(s, likedSongs)} onCycleVisualizer={onCycleVisualizer} vizMode={vizMode} likedSongIds={likedSongIds} onToggleLike={onToggleLike} onDelete={onDelete} onAdd={onAdd}/>
    )}
  </div>
);

// NEW: Most Played View
const MostPlayedView = ({ 
    songs, 
    onPlay, 
    lang,
    onCycleVisualizer,
    vizMode,
    likedSongIds,
    onToggleLike,
    onDelete,
    onAdd
}: { 
    songs: Song[], 
    onPlay: (song: Song, queue: Song[]) => void,
    lang: 'en' | 'zh',
    onCycleVisualizer: () => void,
    vizMode: VisualizerMode,
    likedSongIds: Set<string>,
    onToggleLike: (s: Song) => void,
    onDelete: (s: Song) => void,
    onAdd: (s: Song) => void
}) => (
  <div className="p-8 relative z-10">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-white flex items-center">
          <MusicNoteIcon className="w-8 h-8 mr-3 text-red-500" />
          {t('online.mostPlayed', lang)}
      </h2>
      <div className="text-zinc-500 text-sm">{songs.length} Songs</div>
    </div>
    
    {songs.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-800/30">
        <MusicNoteIcon className="w-16 h-16 text-zinc-700 mb-4" />
        <p className="text-zinc-500">Not enough listening history yet.</p>
      </div>
    ) : (
      <SongList 
        songs={songs} 
        onPlay={(s) => onPlay(s, songs)} 
        onCycleVisualizer={onCycleVisualizer} 
        vizMode={vizMode} 
        likedSongIds={likedSongIds} 
        onToggleLike={onToggleLike}
        onDelete={onDelete} // Passed onDelete to SongList
        onAdd={onAdd}
      />
    )}
  </div>
);


// Settings View
const SettingsView = ({ settings, updateSettings }: { settings: UserSettings, updateSettings: (k: keyof UserSettings, v: any) => void }) => (
    <div className="p-8 max-w-2xl relative z-10">
        <h2 className="text-3xl font-bold text-white mb-8">{t('settings.title', settings.language)}</h2>
        
        <div className="space-y-6">
            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t('settings.language', settings.language)}</label>
                <div className="flex space-x-4">
                    <button 
                        onClick={() => updateSettings('language', 'en')}
                        className={`px-4 py-2 rounded ${settings.language === 'en' ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                    >
                        English
                    </button>
                    <button 
                         onClick={() => updateSettings('language', 'zh')}
                         className={`px-4 py-2 rounded ${settings.language === 'zh' ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}
                    >
                        中文
                    </button>
                </div>
            </div>

            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                <label className="block text-sm font-medium text-zinc-400 mb-3">{t('settings.vizColors', settings.language)}</label>
                <div className="flex space-x-8">
                     <div>
                         <label className="block text-xs text-zinc-500 mb-1">Color 1 (Low Freq)</label>
                         <input 
                            type="color" 
                            value={settings.visualizerColor1}
                            onChange={(e) => updateSettings('visualizerColor1', e.target.value)}
                            className="w-16 h-10 rounded cursor-pointer bg-transparent"
                         />
                     </div>
                     <div>
                         <label className="block text-xs text-zinc-500 mb-1">Color 2 (High Freq)</label>
                         <input 
                            type="color" 
                            value={settings.visualizerColor2}
                            onChange={(e) => updateSettings('visualizerColor2', e.target.value)}
                            className="w-16 h-10 rounded cursor-pointer bg-transparent"
                         />
                     </div>
                </div>
            </div>

            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                <label className="block text-sm font-medium text-zinc-400 mb-3">{t('settings.visualizer', settings.language)}</label>
                <div className="grid grid-cols-2 gap-2">
                    {Object.keys(VisualizerMode).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => updateSettings('visualizerMode', mode)}
                            className={`px-3 py-2 text-sm rounded text-left ${settings.visualizerMode === mode ? 'bg-red-600/20 text-red-500 border border-red-600/50' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
                        >
                            {t(`viz.${mode}`, settings.language)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
)

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showLyrics, setShowLyrics] = useState(false);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [playQueue, setPlayQueue] = useState<Song[]>([]);
  
  // Lifted state for Most Played
  const [mostPlayed, setMostPlayed] = useState<Song[]>([]);

  // User Playlists State
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [addToPlaylistModal, setAddToPlaylistModal] = useState<{isOpen: boolean, song: Song | null}>({isOpen: false, song: null});

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [cloudProviders, setCloudProviders] = useState<RemoteStorageProvider[]>([
      new BaiduCloudProvider(), 
      new SMBNasProvider(),
      new MockCloudProvider('cloud1', 'Google Drive (Mock)', 'CLOUD')
  ]);
  const [cloudFiles, setCloudFiles] = useState<Song[]>([]);
  const [selectedCloudProvider, setSelectedCloudProvider] = useState<RemoteStorageProvider | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showEQ, setShowEQ] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({ 
      language: 'en', 
      theme: 'dark', 
      volume: 0.8,
      visualizerMode: VisualizerMode.OFF,
      visualizerColor1: '#ef4444',
      visualizerColor2: '#3b82f6'
  });
  const [eqBands, setEqBands] = useState<EqualizerBand[]>([
      { frequency: '60Hz', gain: 0 },
      { frequency: '170Hz', gain: 0 },
      { frequency: '310Hz', gain: 0 },
      { frequency: '600Hz', gain: 0 },
      { frequency: '1KHz', gain: 0 },
      { frequency: '3KHz', gain: 0 },
      { frequency: '6KHz', gain: 0 },
      { frequency: '12KHz', gain: 0 },
      { frequency: '14KHz', gain: 0 },
      { frequency: '16KHz', gain: 0 },
  ]);

  // UseEffect hook to remove mock data init
  useEffect(() => {
    // Initial data load for global stats
    // searchOnlineSongs('').then(songs => setMostPlayed(songs.slice(0, 3))); // Mock Most Played REMOVED
  }, []);

  const handleGlobalSearch = (query: string) => {
      setSearchQuery(query);
      setActiveTab('search');
  };

  // --- PLAYLIST MANAGEMENT ---
  const handleCreatePlaylist = () => {
      const name = window.prompt(t('playlist.enterName', settings.language));
      if (name) {
          const newPlaylist: Playlist = {
              id: `pl_${Date.now()}`,
              name,
              coverUrl: '',
              songs: []
          };
          setUserPlaylists(prev => [...prev, newPlaylist]);
      }
  };

  const handleRenamePlaylist = (id: string) => {
      const playlist = userPlaylists.find(p => p.id === id);
      if (!playlist) return;
      const name = window.prompt(t('playlist.enterName', settings.language), playlist.name);
      if (name) {
          setUserPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
      }
  };

  const handleDeletePlaylist = (id: string) => {
      const playlist = userPlaylists.find(p => p.id === id);
      if (!playlist) return;
      if (window.confirm(`${t('common.deleteConfirm', settings.language)} "${playlist.name}"?`)) {
          setUserPlaylists(prev => prev.filter(p => p.id !== id));
          if (activeTab === `playlist_${id}`) setActiveTab('home');
      }
  };

  const handleAddToPlaylistRequest = (song: Song) => {
      setAddToPlaylistModal({ isOpen: true, song });
  };

  const handleConfirmAddToPlaylist = (playlistId: string) => {
      const { song } = addToPlaylistModal;
      if (song) {
          setUserPlaylists(prev => prev.map(p => {
              if (p.id === playlistId) {
                  // Avoid duplicates
                  if (p.songs.find(s => s.id === song.id)) return p;
                  return { ...p, songs: [...p.songs, song] };
              }
              return p;
          }));
      }
      setAddToPlaylistModal({ isOpen: false, song: null });
  };

  const handleRemoveFromPlaylist = (playlistId: string, song: Song) => {
      if (window.confirm(`${t('common.deleteConfirm', settings.language)} "${song.title}" from playlist?`)) {
          setUserPlaylists(prev => prev.map(p => {
              if (p.id === playlistId) {
                  return { ...p, songs: p.songs.filter(s => s.id !== song.id) };
              }
              return p;
          }));
      }
  };

  const initAudio = () => {
    if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return;
    }

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        
        const audio = audioRef.current;
        audio.crossOrigin = "anonymous";
        
        let source;
        try {
            source = ctx.createMediaElementSource(audio);
            source.connect(analyserNode);
            analyserNode.connect(ctx.destination);
        } catch (e) {
            console.warn("Audio Context connect error (likely CORS):", e);
        }

        audioContextRef.current = ctx;
        setAnalyser(analyserNode);
    } catch (e) {
        console.error("Audio Setup Failed", e);
    }
  };

  const handlePlaySong = async (song: Song, newQueue?: Song[]) => {
    initAudio();

    // NEW: Update Most Played (Simple session based history)
    setMostPlayed(prev => {
        const filtered = prev.filter(s => s.id !== song.id);
        return [song, ...filtered].slice(0, 20); // Keep last 20 unique songs
    });

    if (newQueue) {
        setPlayQueue(newQueue);
    }

    let url = song.url;
    if (song.source === MusicSource.LOCAL && song.file) {
      url = URL.createObjectURL(song.file);
    } 

    const audio = audioRef.current;

    if (currentSong?.id === song.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = url;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch(e) {
        console.error("Playback failed", e);
        setIsPlaying(false);
      }
      setCurrentSong(song);
    }
  };

  const togglePlay = () => {
    if (!currentSong) return;
    initAudio();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const handleNext = useCallback(() => {
    if (!currentSong || playQueue.length === 0) return;
    
    const currentIndex = playQueue.findIndex(s => s.id === currentSong.id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= playQueue.length) {
        nextIndex = 0; 
    }
    
    handlePlaySong(playQueue[nextIndex]); 
  }, [currentSong, playQueue]);

  const handlePrev = useCallback(() => {
    if (!currentSong || playQueue.length === 0) return;
    
    const currentIndex = playQueue.findIndex(s => s.id === currentSong.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
        prevIndex = playQueue.length - 1;
    }
    
    handlePlaySong(playQueue[prevIndex]);
  }, [currentSong, playQueue]);

  const handleToggleLike = (song: Song) => {
    setLikedSongIds(prev => {
        const next = new Set(prev);
        if (next.has(song.id)) {
            next.delete(song.id);
            setLikedSongs(ls => ls.filter(s => s.id !== song.id));
        } else {
            next.add(song.id);
            setLikedSongs(ls => [song, ...ls]);
        }
        return next;
    });
  };

  // --- DELETE HANDLERS ---
  const handleDeleteLocal = (s: Song) => {
      if(!window.confirm(t('common.deleteConfirm', settings.language) + ` "${s.title}"?`)) return;
      setLocalSongs(prev => prev.filter(song => song.id !== s.id));
      if (currentSong?.id === s.id) {
          setIsPlaying(false);
          audioRef.current.pause();
          setCurrentSong(null);
      }
  };

  const handleDeleteCloud = (s: Song) => {
       if(!window.confirm(t('common.deleteConfirm', settings.language) + ` "${s.title}"?`)) return;
       setCloudFiles(prev => prev.filter(song => song.id !== s.id));
  };

  // Added delete handler for Most Played
  const handleDeleteMostPlayed = (s: Song) => {
       if(!window.confirm(t('common.deleteConfirm', settings.language) + ` "${s.title}"?`)) return;
       setMostPlayed(prev => prev.filter(song => song.id !== s.id));
  };


  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    
    const onEnd = () => {
        setIsPlaying(false);
        handleNext(); 
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnd);
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnd);
    };
  }, [volume, handleNext]); 

  useEffect(() => {
    if(audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleAddLocalFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newSongs: Song[] = (Array.from(e.target.files) as File[])
        .filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.flac'))
        .map((f, i) => ({
          id: `local_${Date.now()}_${i}`,
          title: f.name.replace(/\.[^/.]+$/, ""),
          artist: 'Unknown Artist',
          album: 'Local Folder',
          duration: 0,
          url: '',
          source: MusicSource.LOCAL,
          file: f
        }));
      setLocalSongs(prev => [...prev, ...newSongs]);
    }
  };

  const handleSelectCloudProvider = async (provider: RemoteStorageProvider) => {
      setSelectedCloudProvider(provider);
      if (provider.isLoggedIn) {
          const files = await provider.listMusicFiles();
          setCloudFiles(files);
      } else {
          setCloudFiles([]);
          setShowLogin(true);
      }
  };

  const handleLoginSuccess = async () => {
      if (selectedCloudProvider) {
          const files = await selectedCloudProvider.listMusicFiles();
          setCloudFiles(files);
      }
  };

  const cycleVisualizer = () => {
      const modes = Object.values(VisualizerMode);
      const currentIndex = modes.indexOf(settings.visualizerMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setSettings(prev => ({ ...prev, visualizerMode: modes[nextIndex] }));
  };

  const renderContent = () => {
    // Check if activeTab is a user playlist
    if (activeTab.startsWith('playlist_')) {
        const playlistId = activeTab.replace('playlist_', '');
        const playlist = userPlaylists.find(p => p.id === playlistId);
        if (playlist) {
            return (
                <UserPlaylistView 
                    playlist={playlist}
                    onPlay={handlePlaySong}
                    lang={settings.language}
                    onCycleVisualizer={cycleVisualizer}
                    vizMode={settings.visualizerMode}
                    likedSongIds={likedSongIds}
                    onToggleLike={handleToggleLike}
                    onRemoveSong={(s) => handleRemoveFromPlaylist(playlistId, s)}
                />
            )
        }
    }

    switch(activeTab) {
      case 'home':
        return (
            <HomeView 
                onPlay={handlePlaySong} 
                lang={settings.language} 
                localSongs={localSongs}
                cloudFiles={cloudFiles}
                cloudProviderName={selectedCloudProvider?.name}
                onCycleVisualizer={cycleVisualizer}
                vizMode={settings.visualizerMode}
                likedSongIds={likedSongIds}
                onToggleLike={handleToggleLike}
                likedSongs={likedSongs}
                mostPlayed={mostPlayed}
                onNavigate={(view) => setActiveTab(view)}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlayPause={togglePlay}
                onDeleteLocal={handleDeleteLocal}
                onDeleteCloud={handleDeleteCloud}
                onSearch={handleGlobalSearch}
                onAdd={handleAddToPlaylistRequest}
            />
        );
      case 'search':
        return (
            <SearchView 
                onPlay={handlePlaySong} 
                lang={settings.language} 
                localSongs={localSongs}
                cloudFiles={cloudFiles}
                onCycleVisualizer={cycleVisualizer}
                vizMode={settings.visualizerMode}
                likedSongIds={likedSongIds}
                onToggleLike={handleToggleLike}
                onDeleteLocal={handleDeleteLocal}
                onDeleteCloud={handleDeleteCloud}
                initialQuery={searchQuery}
                onAdd={handleAddToPlaylistRequest}
            />
        );
      case 'favorites':
        return (
            <FavoritesView 
                likedSongs={likedSongs}
                onPlay={handlePlaySong} 
                lang={settings.language} 
                onCycleVisualizer={cycleVisualizer}
                vizMode={settings.visualizerMode}
                likedSongIds={likedSongIds}
                onToggleLike={handleToggleLike}
                onDelete={handleToggleLike} // Deleting from favorites = unliking
                onAdd={handleAddToPlaylistRequest}
            />
        );
      case 'most_played':
        return (
            <MostPlayedView 
                songs={mostPlayed}
                onPlay={handlePlaySong} 
                lang={settings.language} 
                onCycleVisualizer={cycleVisualizer}
                vizMode={settings.visualizerMode}
                likedSongIds={likedSongIds}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteMostPlayed} // Passed delete handler
                onAdd={handleAddToPlaylistRequest}
            />
        );
      case 'local':
        return <LocalMusicView songs={localSongs} onAddFolder={handleAddLocalFolder} onPlay={handlePlaySong} lang={settings.language} onCycleVisualizer={cycleVisualizer} vizMode={settings.visualizerMode} likedSongIds={likedSongIds} onToggleLike={handleToggleLike} onDelete={handleDeleteLocal} onAdd={handleAddToPlaylistRequest}/>;
      case 'online':
        return <OnlineMusicView onPlay={handlePlaySong} lang={settings.language} onCycleVisualizer={cycleVisualizer} vizMode={settings.visualizerMode} likedSongIds={likedSongIds} onToggleLike={handleToggleLike} onAdd={handleAddToPlaylistRequest}/>;
      case 'cloud':
        return (
            <CloudNasView 
                providers={cloudProviders}
                selectedProvider={selectedCloudProvider}
                onAddProvider={() => alert('Feature to add new provider (Mock)')}
                onSelectProvider={handleSelectCloudProvider}
                files={cloudFiles}
                onPlay={handlePlaySong}
                lang={settings.language}
                onCycleVisualizer={cycleVisualizer}
                vizMode={settings.visualizerMode}
                likedSongIds={likedSongIds}
                onToggleLike={handleToggleLike}
                onDelete={handleDeleteCloud}
                onAdd={handleAddToPlaylistRequest}
            />
        );
      case 'settings':
        return <SettingsView settings={settings} updateSettings={(k, v) => setSettings({...settings, [k]: v})} />;
      default: 
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-900 text-zinc-100 overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      {/* Sidebar */}
      <div className="z-20 h-full">
         <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            lang={settings.language} 
            playlists={userPlaylists}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onRenamePlaylist={handleRenamePlaylist}
         />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <div className="flex-1 overflow-y-auto scroll-smooth pb-24">
            {renderContent()}
        </div>
        
        {/* Absolute Player Bar */}
        <div className="absolute bottom-0 left-0 right-0">
            <PlayerBar 
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlayPause={togglePlay}
                onNext={handleNext} 
                onPrev={handlePrev}
                progress={progress}
                duration={duration}
                onSeek={handleSeek}
                volume={volume}
                onVolumeChange={(e) => setVolume(parseFloat(e.target.value))}
                lang={settings.language}
                onOpenEQ={() => setShowEQ(true)}
                visualizerMode={settings.visualizerMode}
                onCycleVisualizer={cycleVisualizer}
                onOpenFullScreen={() => setIsFullScreen(true)}
                analyser={analyser}
                showLyrics={showLyrics}
                onToggleLyrics={() => setShowLyrics(!showLyrics)}
                vizColor1={settings.visualizerColor1}
                vizColor2={settings.visualizerColor2}
            />
        </div>
      </div>

      {/* Modals & Overlays */}
      {/* Add To Playlist Dialog */}
      {addToPlaylistModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-zinc-800 w-[350px] rounded-lg shadow-xl border border-zinc-700 p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">{t('playlist.addTo', settings.language)}</h3>
                      <button onClick={() => setAddToPlaylistModal({isOpen: false, song: null})} className="text-zinc-400 hover:text-white"><XMarkIcon className="w-5 h-5"/></button>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4 truncate">
                      {addToPlaylistModal.song?.title}
                  </p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                      <button 
                          onClick={handleCreatePlaylist}
                          className="w-full text-left p-3 rounded bg-zinc-700/30 hover:bg-zinc-700 flex items-center text-green-400"
                      >
                          <PlusCircleIcon className="w-4 h-4 mr-2" />
                          {t('playlist.create', settings.language)}
                      </button>
                      
                      {userPlaylists.length === 0 && (
                          <p className="text-center text-zinc-600 py-4 text-xs">No playlists found</p>
                      )}

                      {userPlaylists.map(pl => (
                          <button
                              key={pl.id}
                              onClick={() => handleConfirmAddToPlaylist(pl.id)}
                              className="w-full text-left p-3 rounded bg-zinc-700/30 hover:bg-zinc-700 text-white flex items-center"
                          >
                              <MusicNoteIcon className="w-4 h-4 mr-2 text-zinc-500" />
                              {pl.name}
                              <span className="ml-auto text-xs text-zinc-500">{pl.songs.length}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
      
      {showLyrics && !isFullScreen && (
         <LyricsOverlay lyricsRaw={currentSong?.lyrics} currentTime={progress} />
      )}

      <FullScreenPlayer 
         isOpen={isFullScreen}
         onClose={() => setIsFullScreen(false)}
         currentSong={currentSong}
         isPlaying={isPlaying}
         onPlayPause={togglePlay}
         onNext={handleNext} 
         onPrev={handlePrev}
         progress={progress}
         duration={duration}
         onSeek={handleSeek}
         analyser={analyser}
         visualizerMode={settings.visualizerMode}
         lang={settings.language}
         vizColor1={settings.visualizerColor1}
         vizColor2={settings.visualizerColor2}
      />

      <LoginDialog 
        provider={selectedCloudProvider}
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        lang={settings.language}
      />

      <EQPanel 
        isOpen={showEQ}
        onClose={() => setShowEQ(false)}
        bands={eqBands}
        setBands={setEqBands}
        lang={settings.language}
      />
    </div>
  );
}