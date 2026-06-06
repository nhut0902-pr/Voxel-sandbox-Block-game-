import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Volume2, 
  VolumeX, 
  Users, 
  Layers, 
  Compass,
  Zap,
  Hammer,
  HelpCircle,
  Activity,
  Trophy,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface LandingPageProps {
  onEnterGame: () => void;
}

export default function LandingPage({ onEnterGame }: LandingPageProps) {
  /* --- Interactive States --- */
  const [selectedBiome, setSelectedBiome] = useState('cherry');
  const [activeTab, setActiveTab] = useState<'features' | 'crafting'>('features');
  const [selectedCraftRecipe, setSelectedCraftRecipe] = useState('sw4');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [simulatedOnlineCount, setSimulatedOnlineCount] = useState(61);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* --- Read player records from browser storage --- */
  const [localStats, setLocalStats] = useState<{
    pos?: [number, number, number];
    gold?: number;
    lvl?: number;
    kills?: number;
    biome?: string;
    hasSave: boolean;
  }>({ hasSave: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vv5_react');
      if (raw) {
        const d = JSON.parse(raw);
        setLocalStats({
          pos: d.pos,
          gold: d.gold || 0,
          lvl: d.lv || 1,
          kills: d.kills || 0,
          biome: d.biome || 'plains',
          hasSave: true
        });
      }
    } catch (e) {
      console.warn("Failed to read previous voxel local saves", e);
    }
  }, []);

  // Online count simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(50, Math.min(85, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* --- Audio Synthesis for Crisp Click effects --- */
  const playRetroClick = (pitch = 440, type: OscillatorType = 'sine', duration = 0.05) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignored
    }
  };

  /* --- Game Data definitions --- */
  const BIOMES = [
    {
      id: 'cherry',
      name: 'Cherry Bluffs',
      emoji: '🌸',
      difficulty: 'Mộng Mơ ✨',
      desc: 'Thiên đường thơ mộng tràn ngập hoa anh đào rơi lãng đãng quanh năm. Nơi cất giấu vàng ròng và gỗ Đào quý hiếm.',
      features: ['Gỗ anh đào hồng', 'Cỏ linh thụ', 'Rương kho báu']
    },
    {
      id: 'volcano',
      name: 'Volcanic Hell',
      emoji: '🌋',
      difficulty: 'Nguy hiểm 🔥',
      desc: 'Vùng đất dung nham đỏ rực sục sôi chảy qua đá thạch cổ Obsidian. Quặng Magma nguyên chất rình rập rực cháy.',
      features: ['Khối Obsidian', 'Magma cực nóng', 'Nanh cổ quái']
    },
    {
      id: 'snow',
      name: 'Glacial Peak',
      emoji: '❄️',
      difficulty: 'Truyền Thuyết 🌨️',
      desc: 'Vương quốc tuyết vĩnh cửu bao phủ núi tuyết cao chọc trời. Cực kỳ trơn trượt nhưng chứa thánh quặng thạch anh.',
      features: ['Băng cổ nghìn năm', 'Bão tuyết cản lối', 'Tuyết xốp']
    },
    {
      id: 'desert',
      name: 'Dunes of Doom',
      emoji: '🏜️',
      difficulty: 'Thử Thách ☀️',
      desc: 'Hoang mạc nắng cháy khô cằn với các đền thờ cát chứa mật mã chế tạo súng. Hãy đề phòng Golem cát bảo vệ.',
      features: ['Cát chảy lún', 'Cây xương rồng thô', 'Bảo vật Đền Cát']
    }
  ];

  const RECIPES = [
    { id: 'sw4', name: 'Kiếm Kim Cương', emoji: '💎⚔️', stat: '10 Sát Thương', cost: '3x Đá Quý + 2x Thép', desc: 'Đúc từ khoáng kim quý ngàn năm, gạt gục thây ma chỉ với 2 nhát chém.' },
    { id: 'pistol', name: 'Súng Lục Cổ', emoji: '🔫', stat: '14 Sát Thương', cost: '4x Sắt Miếng + 1x Lò Xo', desc: 'Sự kết hợp giữa công nghệ đúc hiện đại và đạn thạch. Cho phép ám sát tầm xa cực an toàn.' },
    { id: 'wings', name: 'Cánh Thần Linh', emoji: '🪽', stat: 'Kích Hoạt Bay Lượn', cost: '5x Lông Vũ Thổ + 1x Tinh Linh', desc: 'Vượt mọi trở ngại địa hình, bơi qua biển lửa magma dễ như bỡn.' },
    { id: 'pot_hp', name: 'Bình Dược Lớn', emoji: '🧪', stat: '+10 Hồi Máu', cost: '2x Thảo Dược + 1x Nước Suối', desc: 'Dược liệu đặc chế hồi phục sinh lực tức thời trong những pha giao tranh sục sôi.' }
  ];

  const FAQS = [
    { q: "Làm sao để lưu lại công trình xây dựng của tôi?", a: "Trò chơi tích hợp mã nguồn Autosave thế hệ mới, tự động lưu các khối bạn đặt/phá vào ổ nhớ cục bộ trình duyệt. Khi bạn tải lại hoặc vào đúng phân vùng sinh cảnh, thế giới sẽ hồi sinh vẹn nguyên." },
    { q: "Mở Túi đồ và chế tạo vật phẩm bằng cách nào?", a: "Phím E phục vụ mở màn hình túi đồ trên máy tính, hoặc kích hoạt trực tiếp bằng nút '背包 TÚI ĐỒ (E)' trên thanh điều hướng di động để uống dược hoàn hồi máu và rèn các thần khí." },
    { q: "Tôi có thể chơi cùng đồng đội không?", a: "Hoàn toàn khả thi. Hệ thống hỗ trợ chia sẻ liên kết trực tiếp tích hợp phòng ban co-op tức thời để cùng khai khoáng, mài đá hoặc xây pháo đài." },
    { q: "Sự khác biệt giữa Sinh Tồn và Sáng Tạo?", a: "Nền tảng Survival yêu cầu thám hiểm viên né tránh cạm bẫy, nanh quái khát vàng ban đêm để tăng tiến cấp độ. Creative cho phép tự do kiến tạo, đặt phá khối lập phương bất khả xâm phạm." }
  ];

  const clearAllSaves = () => {
    try {
      localStorage.removeItem('vv5_react');
      setLocalStats({ hasSave: false });
      playRetroClick(220, 'triangle', 0.25);
      alert("🧹 Đã xóa tệp lưu trữ cục bộ. Hãy làm mới thế giới mới!");
    } catch (e) {}
  };

  return (
    <div id="landing-container" className="absolute inset-0 w-full h-full text-[#A1A1AA] overflow-y-auto bg-[#09090B] font-sans selection:bg-[#4ADE80] selection:text-black scroll-smooth">
      
      {/* 1. HEADER SECTION */}
      <header id="main-header" className="border-b border-[#1F1F23] bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-50">
        <div id="header-wrapper" className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div id="header-logo-group" className="flex items-center gap-3">
            <span id="header-logo" className="text-white font-bold leading-none tracking-widest text-sm uppercase">
              VOXELVERSE <span className="text-[#4ADE80] ml-1">v2.5 PRO</span>
            </span>
            <span id="header-badge" className="hidden lg:inline-block bg-[#18181B] border border-[#27272A] text-[9px] text-[#A1A1AA] rounded px-2.5 py-1 font-bold uppercase tracking-wider">
              Đồng Bộ Thế Giới Đa Nền Tảng Tuyệt Mỹ
            </span>
          </div>

          <div id="header-actions" className="flex items-center gap-4">
            {/* Audio toggle button with minimalist outline */}
            <button
              id="audio-toggle-btn"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                setTimeout(() => playRetroClick(520, 'sine', 0.05), 30);
              }}
              className="p-2.5 rounded-md bg-[#18181B] border border-[#27272A] hover:border-[#4ADE80]/40 text-white transition-all cursor-pointer"
              title="Kích hoạt âm thanh"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#4ADE80]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[#71717A]" />
              )}
            </button>

            <button
              id="header-cta-btn"
              onClick={() => {
                playRetroClick(600, 'sine');
                onEnterGame();
              }}
              className="px-5 py-2 rounded-md bg-[#4ADE80] hover:bg-[#3ec372] text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Vào Thế Giới
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO & STATS GRID */}
      <section id="hero-section" className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column (Main Headline + CTAs) */}
        <div id="hero-content-col" className="lg:col-span-7 space-y-6 text-left">
          <h1 id="hero-main-title" className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.1] uppercase">
            Thế Giới Voxel Đỉnh Cao <br />
            <span className="text-[#4ADE80]">Mộng Mơ &amp; Bí Truyền</span>
          </h1>

          <p id="hero-subheading" className="max-w-xl text-[#71717A] text-sm md:text-base leading-relaxed font-normal">
            Chém quái rèn bảo vật, khám phá quần thể sinh thái ngẫu nhiên mượt mà trên trình duyệt. Không rườm rà, lưu giữ nguyên vẹn công trình xây lắp vạn đại.
          </p>

          {/* Quick Stats Block without bulky containers */}
          <div id="quick-stats-row" className="flex items-center gap-10 pt-4 pb-2 border-t border-b border-[#1F1F23]/80 max-w-lg">
            <div id="stat-col-players">
              <span id="stat-val-players" className="block text-2xl font-semibold text-[#4ADE80] font-mono tracking-tight">
                ~{simulatedOnlineCount}
              </span>
              <span id="stat-lbl-players" className="text-xs text-[#71717A] uppercase tracking-wider">
                Phiêu lưu thủ trực tuyến
              </span>
            </div>
            <div id="stat-col-realms">
              <span id="stat-val-realms" className="block text-2xl font-semibold text-[#4ADE80] font-mono tracking-tight">
                6
              </span>
              <span id="stat-lbl-realms" className="text-xs text-[#71717A] uppercase tracking-wider">
                Phân Miền đúc rèn
              </span>
            </div>
          </div>

          <div id="hero-cta-btn-group" className="flex flex-wrap items-center gap-4 pt-2">
            <button
              id="hero-play-now-btn"
              onClick={() => {
                playRetroClick(440, 'triangle');
                onEnterGame();
              }}
              className="px-8 py-3.5 rounded-md bg-[#4ADE80] hover:bg-[#3ec372] text-black font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Khởi Hành Ngay</span>
              <Play className="w-3.5 h-3.5 fill-black stroke-none" />
            </button>

            <a
              id="hero-guide-btn"
              href="#biomes-section"
              className="px-8 py-3.5 rounded-md bg-transparent border border-[#27272A] hover:border-[#4ADE80]/30 text-white font-medium text-xs uppercase tracking-wider transition-all text-center"
            >
              Tổ Đường Thám Hiểm
            </a>
          </div>
        </div>

        {/* Right Column (Minimal Interactive Outpost Card) */}
        <div id="hero-profile-col" className="lg:col-span-5">
          <div id="profile-card" className="bg-[#18181B] border border-[#27272A] rounded-xl p-6 md:p-8 space-y-6">
            <div id="profile-card-header" className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <h3 id="profile-card-title" className="text-sm font-semibold text-white uppercase tracking-wider">
                Hồ Sơ Tiền Đồn Của Bạn
              </h3>
              <span id="profile-badge" className="text-[10px] text-[#4ADE80] font-mono uppercase bg-[#4ADE80]/10 border border-[#4ADE80]/20 px-2 py-0.5 rounded">
                Local Cache
              </span>
            </div>

            {localStats.hasSave ? (
              <div id="profile-active-stats" className="space-y-6">
                {/* Visual 3-axis Stats Grid */}
                <div id="profile-stats-grid" className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-[#09090B] border border-[#27272A] rounded">
                    <span className="block text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Level</span>
                    <span className="block text-base font-semibold text-white mt-1">LV.{localStats.lvl}</span>
                  </div>
                  <div className="p-3 bg-[#09090B] border border-[#27272A] rounded">
                    <span className="block text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Sinh Lực</span>
                    <span className="block text-xs text-white mt-1.5">Max HP 20+</span>
                  </div>
                  <div className="p-3 bg-[#09090B] border border-[#27272A] rounded">
                    <span className="block text-[10px] text-[#71717A] uppercase font-bold tracking-wider">Kho báu</span>
                    <span className="block text-base font-semibold text-[#4ADE80] mt-1">{localStats.gold}🪙</span>
                  </div>
                </div>

                <div id="profile-meta-lines" className="text-xs space-y-2 border-t border-[#27272A] pt-4">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Hạ gục quái vương:</span>
                    <span className="text-[#F43F5E] font-semibold font-mono">{localStats.kills} mạng</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Vùng đất ghi nhận:</span>
                    <span className="text-white font-medium capitalize">#{localStats.biome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Hạt giống máy chủ:</span>
                    <span className="text-white font-mono text-[10px]">'voxelverse-2026-pro-generation'</span>
                  </div>
                </div>

                <div id="profile-card-cta-group" className="flex gap-3 pt-2">
                  <button
                    id="profile-resume-btn"
                    onClick={onEnterGame}
                    className="flex-1 py-3 px-4 rounded bg-[#4ADE80] hover:bg-[#3ec372] text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Vào Tiếp Ván Chơi
                  </button>
                  <button
                    id="profile-reset-btn"
                    onClick={clearAllSaves}
                    className="py-3 px-4 rounded bg-transparent border border-[#3F3F46] hover:bg-neutral-900 text-xs text-rose-400 font-bold tracking-wider transition-colors cursor-pointer"
                  >
                    Reset Map
                  </button>
                </div>
              </div>
            ) : (
              <div id="profile-empty-state" className="py-8 text-center space-y-3">
                <span className="block text-2xl font-mono text-[#4ADE80]">🔒</span>
                <p className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">Bản đồ thám hiểm trống</p>
                <p className="text-xs text-[#71717A] max-w-xs mx-auto leading-relaxed">
                  Vui lòng khởi chạy thế giới mới, dữ liệu khối và vàng của bạn sẽ được lưu giữ tự động cực chuẩn.
                </p>
                <button
                  id="profile-create-btn"
                  onClick={onEnterGame}
                  className="mt-2 w-full py-2.5 rounded bg-[#4ADE80] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#3ec372] transition-colors cursor-pointer"
                >
                  Khởi Tạo Bản Đồ Mới
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. TÍNH NĂNG ĐỘC QUYỀN (MODERN BENTO GRID) */}
      <section id="features-section" className="border-t border-[#1F1F23] bg-[#09090B]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div id="features-header" className="max-w-2xl text-left space-y-3 mb-12">
            <span id="features-category" className="text-xs font-semibold text-[#4ADE80] uppercase tracking-widest block">
              TINH HOA CỐT LÕI
            </span>
            <h2 id="features-title" className="text-3xl md:text-4xl font-medium tracking-tight text-white uppercase">
              Cơ Chế Sinh Tồn Phi Thường
            </h2>
            <p id="features-desc" className="text-[#71717A] text-sm">
              Sắp đặt tài liệu thế giới thám hiểm tối tân nhất. Mọi biến thể khối thạch được quy đổi trơn tru.
            </p>
          </div>

          <div id="features-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1 */}
            <div id="feat-box-1" className="p-8 bg-[#18181B] border border-[#27272A] rounded-xl flex flex-col justify-between h-72">
              <span className="text-2xl text-[#4ADE80]">🧭</span>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-semibold text-white uppercase tracking-wide">6 Quần Thể Sinh Thái</h3>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Chu du qua Hoang Sa Mạc, Băng Thạch lạnh cóng, hay Rừng Anh Đào cỏ mộc. Khai khoáng các quặng quý hiếm tại mỗi điểm phân cực.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#4ADE80] uppercase tracking-widest font-black block">6 BIOME CHUYÊN BIỆT</span>
            </div>

            {/* Box 2 */}
            <div id="feat-box-2" className="p-8 bg-[#18181B] border border-[#27272A] rounded-xl flex flex-col justify-between h-72">
              <span className="text-2xl text-[#4ADE80]">⚔️</span>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Vũ Khí & Sinh Vật Kỳ Vĩ</h3>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Rèn gươm thần khí tối thượng, chế tác súng tầm xa an toàn, hạ gục Creeper lửng lơ để tích trữ rương vàng bổ trợ sinh lực cấp tốc.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#4ADE80] uppercase tracking-widest font-black block">15+ VẬT PHẨM DUY CHẤT</span>
            </div>

            {/* Box 3 */}
            <div id="feat-box-3" className="p-8 bg-[#18181B] border border-[#27272A] rounded-xl flex flex-col justify-between h-72">
              <span className="text-2xl text-[#4ADE80]">💾</span>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Công Trình Vĩnh Cửu</h3>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Tòa lâu đài nguy nga hay túp lều tranh mộc mạc đều được máy chủ kết nối tự động lưu trữ, tái cấu trúc không lo mất mát dữ liệu.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#4ADE80] uppercase tracking-widest font-black block">ĐỒNG BỘ LOCAL STORAGE</span>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CLINICAL BIOMES & RECIPES COMPONENT */}
      <section id="biomes-section" className="border-t border-[#1F1F23] bg-[#09090B]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left controller sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <span className="text-xs font-semibold text-[#4ADE80] uppercase tracking-widest block">
                BÁCH KHOA TOÀN THƯ
              </span>
              <h3 className="text-2xl md:text-3xl font-medium text-white uppercase leading-tight">
                DỮ LIỆU ĐỊA CỰC KHÍ GIỚI
              </h3>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Xem nhanh các phân vùng sinh thái học và bảng vàng chế tác đỉnh cao được ghi nhận chính xác theo từng hệ số thế giới.
              </p>

              {/* Minimal Slide Tabs with no gradient glows */}
              <div className="p-1 bg-[#18181B] border border-[#27272A] rounded flex gap-1">
                <button
                  onClick={() => {
                    playRetroClick(460, 'sine');
                    setActiveTab('features');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'features' 
                      ? 'bg-[#4ADE80] text-black' 
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Sinh cảnh
                </button>
                <button
                  onClick={() => {
                    playRetroClick(500, 'sine');
                    setActiveTab('crafting');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'crafting' 
                      ? 'bg-[#4ADE80] text-black' 
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Chế tác
                </button>
              </div>
            </div>

            {/* Right content display tab area */}
            <div className="lg:col-span-8 w-full">
              <AnimatePresence mode="wait">
                {activeTab === 'features' ? (
                  <motion.div
                    key="tab-features"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {BIOMES.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          playRetroClick(400, 'triangle');
                          setSelectedBiome(b.id);
                        }}
                        className={`p-6 rounded-lg border transition-all cursor-pointer ${
                          selectedBiome === b.id
                            ? 'bg-[#18181B] border-[#4ADE80]'
                            : 'bg-[#18181B]/55 border-[#27272A] hover:border-[#3F3F46]'
                        }`}
                      >
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className="text-2xl">{b.emoji}</span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#09090B] px-2 py-0.5 rounded text-[#71717A] border border-[#27272A]">
                            {b.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-4 uppercase tracking-wider">{b.name}</h4>
                        <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">{b.desc}</p>
                        
                        <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-[#27272A]">
                          {b.features.map((feat, idx) => (
                            <span key={idx} className="text-[9px] bg-[#09090B] px-2 py-0.5 rounded text-[#4ADE80] font-medium font-mono">
                              #{feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-crafting"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {RECIPES.map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            playRetroClick(485, 'sine');
                            setSelectedCraftRecipe(r.id);
                          }}
                          className={`p-4 rounded border text-left transition-colors flex flex-col gap-2 cursor-pointer ${
                            selectedCraftRecipe === r.id
                              ? 'bg-[#18181B] border-[#4ADE80]'
                              : 'bg-[#18181B]/55 border-[#27272A] hover:border-[#3F3F46]'
                          }`}
                        >
                          <span className="text-xl">{r.emoji}</span>
                          <div>
                            <span className="block text-xs font-bold text-white uppercase tracking-wider">{r.name}</span>
                            <span className="text-[9px] text-[#71717A] font-mono block mt-1">{r.stat}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Active detailed blueprint */}
                    {(() => {
                      const active = RECIPES.find(r => r.id === selectedCraftRecipe) || RECIPES[0];
                      return (
                        <div className="bg-[#18181B] border border-[#27272A] p-6 rounded-lg relative overflow-hidden">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#4ADE80] block">
                            CÔNG THỨC RÈN ĐÚC BẢO KHÍ
                          </span>
                          <h4 className="text-base font-bold text-white mt-1.5 uppercase tracking-wider">
                            {active.name} <span className="text-xs text-[#71717A] font-mono normal-case">({active.stat})</span>
                          </h4>
                          <p className="text-[#A1A1AA] text-xs mt-2 italic leading-relaxed">
                            "{active.desc}"
                          </p>
                          <div className="flex gap-2 items-center mt-4 pt-4 border-t border-[#27272A] text-xs font-medium">
                            <span className="text-[#71717A] uppercase tracking-wide text-[10px]">Cát sỏi thạch hiến rèn:</span>
                            <span className="text-[#4ADE80] font-mono">{active.cost}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* 5. ROADMAP (TIMELINE DECK) */}
      <section id="roadmap-section" className="border-t border-[#1F1F23] bg-[#09090B]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div id="roadmap-header" className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-semibold text-[#4ADE80] uppercase tracking-widest block">
              MỐC PHÁT TRIỂN TIÊN PHONG
            </span>
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-white uppercase">
              LỘ TRÌNH LÕI ENGINE VOXEL
            </h2>
            <p className="text-xs text-[#71717A]">
              Dấu chân phát triển, hoàn thiện không ngừng để đưa game thâu nạp cấu trúc vạn khoáng cực độ.
            </p>
          </div>

          <div id="roadmap-tree shadow" className="max-w-3xl mx-auto space-y-4">
            
            <div className="p-6 bg-[#18181B] border border-[#27272A] rounded-lg flex gap-4 items-start">
              <span className="h-7 w-7 rounded bg-[#4ADE80]/15 text-[#4ADE80] flex items-center justify-center font-mono font-bold text-xs uppercase tracking-wider shrink-0 mt-0.5">
                Q1
              </span>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-[#4ADE80] uppercase tracking-widest block">Hoàn Tất</span>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Cấu Trúc Mesh Voxel Đột Phá</h4>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Tối ưu hóa triệt để thuật toán dựng khối 3D trên GPU. Đạt 60FPS tiêu chuẩn mượt mà trên cả trình duyệt di động yếu, tự động đồng bộ hóa vùng đệm.
                </p>
              </div>
            </div>

            <div className="p-6 bg-[#18181B] border border-[#27272A] rounded-lg flex gap-4 items-start">
              <span className="h-7 w-7 rounded bg-[#4ADE80] text-black flex items-center justify-center font-mono font-bold text-xs uppercase tracking-wider shrink-0 mt-0.5">
                Q2
              </span>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-[#4ADE80] uppercase tracking-widest block">Đang Thực Thi</span>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Tái Cấu Trúc HUD &amp; Giao Diện Di Động</h4>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Lược bỏ rườm rà, bọc tay cầm joystick láng mượt. Bổ sung bản đồ mini thu nhỏ cạnh góc trái và chế độ tùy biến rương chứa đồ chuyên biệt.
                </p>
              </div>
            </div>

            <div className="p-6 bg-[#18181B]/40 border border-[#27272A]/70 rounded-lg flex gap-4 items-start opacity-50">
              <span className="h-7 w-7 rounded bg-[#27272A] text-[#71717A] flex items-center justify-center font-mono font-bold text-xs uppercase tracking-wider shrink-0 mt-0.5">
                Q3
              </span>
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-[#71717A] uppercase tracking-widest block">Kế hoạch tương lai</span>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Tác Chiến AI Thám Hiểm NPCs</h4>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  Tích hợp thợ rèn AI tự động huấn luyện kỹ thuật xây lắp, cung cấp hệ nhiệm vụ thu thập tinh hoa đá thánh và cốt truyện cổ thuật.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FAQ INTERACTIVE ACCORDION */}
      <section id="faq-section" className="border-t border-[#1F1F23] bg-[#09090B]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-white uppercase text-center mb-10">
            Cẩm Nang Khẩn Cấp (Hỏi Đáp)
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-[#27272A] bg-[#18181B] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => {
                      playRetroClick(450, 'sine', 0.03);
                      setOpenFaq(isOpen ? null : idx);
                    }}
                    className="w-full text-left px-6 py-4.5 flex items-center justify-between font-semibold text-white text-sm hover:text-[#4ADE80] cursor-pointer transition-colors"
                  >
                    <span className="uppercase tracking-wide text-xs">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#71717A] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#4ADE80]' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="border-t border-[#27272A]"
                      >
                        <p className="p-6 text-xs text-[#A1A1AA] leading-relaxed font-sans bg-[#18181B]/60">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FINAL DOWNLOAD & FOOTER */}
      <footer id="final-cta-section" className="border-t border-[#1F1F23] bg-[#09090B] text-center">
        <div className="max-w-7xl mx-auto px-6 py-20 space-y-6">
          <span className="inline-block text-xl">🏰</span>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white uppercase leading-none">
            Thành Lập Đế Chế Riêng Biệt Ngay Hôm Nay
          </h2>
          <p className="text-xs md:text-sm text-[#71717A] max-w-md mx-auto leading-relaxed">
            Không cần tải đặt trình duyệt hay phần mềm giả lập, không tốn dung tải bộ nhớ thứ cấp. Duy nhất một nhấp khởi hành thế giới diệu vợi.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <button
              onClick={() => {
                playRetroClick(500, 'square');
                onEnterGame();
              }}
              className="w-full py-4 bg-[#4ADE80] hover:bg-[#3ec372] text-black font-bold text-xs uppercase tracking-widest rounded-md cursor-pointer transition-all"
            >
              Chơi Ngay Miễn Phí
            </button>
          </div>

          <div className="pt-20 border-t border-[#1F1F23] flex flex-col md:flex-row items-center justify-between text-[11px] text-[#71717A]">
            <p className="text-left leading-relaxed">
              &copy; 2026 Voxelverse Studio. All rights reserved. Minecraft Legends and Cube World inspiration. Indie quality standard.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0 font-semibold uppercase tracking-wider">
              <span className="hover:text-white transition-colors cursor-pointer">Bảo mật</span>
              <span className="text-[#3F3F46]">·</span>
              <span className="hover:text-white transition-colors cursor-pointer">Điều khoản</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
