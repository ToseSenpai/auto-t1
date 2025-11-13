import { useStore, DateTimeConfig } from "../store/useStore";

function DateTimeConfigPanel() {
  const dateTimeConfig = useStore((state) => state.dateTimeConfig);
  const setDateTimeConfig = useStore((state) => state.setDateTimeConfig);
  const isRunning = useStore((state) => state.isRunning);

  // Preset options for quick selection
  const presets: { label: string; value: string; config: DateTimeConfig }[] = [
    {
      label: "Oggi alle 20:00 (predefinito)",
      value: "today-fixed-20",
      config: { mode: 'today-fixed', fixedTime: '20:00' }
    },
    {
      label: "Oggi - ora attuale",
      value: "today-current",
      config: { mode: 'today-current' }
    },
    {
      label: "Personalizza data e ora",
      value: "custom",
      config: { mode: 'custom-fixed', customDate: '', fixedTime: '20:00' }
    }
  ];

  // Handle preset selection
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = presets.find(p => p.value === e.target.value);
    if (selectedPreset) {
      setDateTimeConfig(selectedPreset.config);
    }
  };

  // Get current preset value
  const getCurrentPresetValue = (): string => {
    if (dateTimeConfig.mode === 'today-fixed' && dateTimeConfig.fixedTime === '20:00') {
      return 'today-fixed-20';
    }
    if (dateTimeConfig.mode === 'today-current') {
      return 'today-current';
    }
    return 'custom';
  };

  // Handle custom date change
  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTimeConfig({
      ...dateTimeConfig,
      customDate: e.target.value
    });
  };

  // Handle fixed time change
  const handleFixedTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTimeConfig({
      ...dateTimeConfig,
      fixedTime: e.target.value
    });
  };

  // Handle sub-mode selection (for custom preset)
  const handleSubModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as DateTimeConfig['mode'];
    setDateTimeConfig({
      ...dateTimeConfig,
      mode
    });
  };

  const isCustomMode = getCurrentPresetValue() === 'custom';
  const needsCustomDate = dateTimeConfig.mode.includes('custom');
  const needsFixedTime = dateTimeConfig.mode.includes('fixed');

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-200 tracking-tight">
        Data e Ora Arrivo
      </h2>

      {/* Preset Dropdown */}
      <div className="space-y-2">
        <label className="block text-caption-upper text-gray-400">
          Configurazione
        </label>
        <div className="relative">
          <select
            value={getCurrentPresetValue()}
            onChange={handlePresetChange}
            disabled={isRunning}
            className="w-full px-3 py-2.5 pr-8 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-accent-blue focus:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all appearance-none cursor-pointer"
          >
            {presets.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Custom Mode Options */}
      {isCustomMode && (
        <div className="space-y-3 pl-2 border-l-2 border-accent-blue/30">
          {/* Sub-mode Selection */}
          <div className="space-y-2">
            <label className="block text-caption-upper text-gray-400">
              Tipo Personalizzazione
            </label>
            <select
              value={dateTimeConfig.mode}
              onChange={handleSubModeChange}
              disabled={isRunning}
              className="w-full px-3 py-2.5 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-accent-blue focus:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="today-fixed">Data odierna + Ora fissa</option>
              <option value="today-current">Data odierna + Ora attuale</option>
              <option value="custom-fixed">Data personalizzata + Ora fissa</option>
              <option value="custom-current">Data personalizzata + Ora attuale</option>
            </select>
          </div>

          {/* Custom Date Input */}
          {needsCustomDate && (
            <div className="space-y-2">
              <label className="block text-caption-upper text-gray-400">
                Data Personalizzata
              </label>
              <div className="win11-input-wrapper">
                <input
                  type="date"
                  value={dateTimeConfig.customDate || ''}
                  onChange={handleCustomDateChange}
                  disabled={isRunning}
                  className="win11-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="win11-input-accent-line"></div>
              </div>
            </div>
          )}

          {/* Fixed Time Input */}
          {needsFixedTime && (
            <div className="space-y-2">
              <label className="block text-caption-upper text-gray-400">
                Ora Fissa
              </label>
              <div className="win11-input-wrapper">
                <input
                  type="time"
                  value={dateTimeConfig.fixedTime || '20:00'}
                  onChange={handleFixedTimeChange}
                  disabled={isRunning}
                  className="win11-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="win11-input-accent-line"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Text */}
      <div className="flex items-start gap-2 p-2.5 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
        <svg
          className="w-3.5 h-3.5 text-accent-blue flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-caption text-gray-300 leading-relaxed">
          {dateTimeConfig.mode === 'today-current' && "Verrà usata la data odierna con l'ora al momento dell'esecuzione"}
          {dateTimeConfig.mode === 'today-fixed' && `Verrà usata la data odierna con ora fissa alle ${dateTimeConfig.fixedTime || '20:00'}`}
          {dateTimeConfig.mode === 'custom-current' && "Verrà usata la data personalizzata con l'ora al momento dell'esecuzione"}
          {dateTimeConfig.mode === 'custom-fixed' && `Verrà usata la data personalizzata con ora fissa alle ${dateTimeConfig.fixedTime || '20:00'}`}
        </p>
      </div>
    </div>
  );
}

export default DateTimeConfigPanel;
