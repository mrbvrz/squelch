import { useState } from 'react';
import type { Station, StreamTestResult, StreamType } from '../../types';
import type { SquelchWindowApi } from '../types';
import { detectStreamTypeFromUrl } from '../../utils/stream';

export interface UseStationModalOptions {
    groups: string[];
    selectedGroup: string;
    api: SquelchWindowApi;
    refreshAll: () => Promise<void>;
}

export function useStationModal({
    groups,
    selectedGroup,
    api,
    refreshAll
}: UseStationModalOptions) {
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingStation, setEditingStation] = useState<Station | null>(null);
    const [formName, setFormName] = useState<string>('');
    const [formUrl, setFormUrl] = useState<string>('');
    const [formLogo, setFormLogo] = useState<string>('');
    const [formGenre, setFormGenre] = useState<string>('Pop');
    const [formCity, setFormCity] = useState<string>('Jakarta');
    const [formCountry, setFormCountry] = useState<string>('ID');
    const [formGroup, setFormGroup] = useState<string>('');
    const [formType, setFormType] = useState<StreamType>('mp3');
    const [formTags, setFormTags] = useState<string>('');
    const [isTestingStream, setIsTestingStream] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<StreamTestResult | null>(null);

    const openAddStationModal = () => {
        setEditingStation(null);
        setFormName('');
        setFormUrl('');
        setFormLogo('');
        setFormGenre('Pop');
        setFormCity('Jakarta');
        setFormCountry('ID');
        setFormGroup(selectedGroup !== 'ALL' ? selectedGroup : groups[0] || '');
        setFormType('mp3');
        setFormTags('');
        setTestResult(null);
        setIsFormOpen(true);
    };

    const openEditStationModal = (st: Station) => {
        setEditingStation(st);
        setFormName(st.name);
        setFormUrl(st.streamUrl);
        setFormLogo(st.logoUrl || '');
        setFormGenre(st.genre);
        setFormCity(st.city);
        setFormCountry(st.country);
        setFormGroup(st.group);
        setFormType(st.streamType);
        setFormTags(st.tags.join(', '));
        setTestResult(null);
        setIsFormOpen(true);
    };

    const handleTestStream = async () => {
        if (!formUrl.trim()) return;
        setIsTestingStream(true);
        setTestResult(null);
        try {
            const res = await api.testStreamUrl(formUrl.trim());
            setTestResult(res);
            if (res.ok) {
                setFormType(res.streamType);
                if (res.resolvedUrl && res.resolvedUrl !== formUrl.trim()) {
                    setFormUrl(res.resolvedUrl);
                }
                if (!formName.trim() && res.icyName) {
                    setFormName(res.icyName);
                }
                if (!formLogo.trim() && res.noiceCatalogInfo?.logoUrl) {
                    setFormLogo(res.noiceCatalogInfo.logoUrl);
                }
            }
        } finally {
            setIsTestingStream(false);
        }
    };

    const handleSaveStation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !formUrl.trim()) return;

        const detected = detectStreamTypeFromUrl(formUrl.trim());
        const finalStreamType = detected || formType;

        await api.saveStation({
            id: editingStation?.id,
            name: formName.trim(),
            streamUrl: formUrl.trim(),
            streamType: finalStreamType,
            logoUrl: formLogo.trim() || null,
            genre: formGenre.trim() || 'Radio',
            city: formCity.trim() || 'Indonesia',
            country: formCountry.trim() || 'ID',
            group: formGroup.trim() || groups[0] || '',
            tags: formTags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            isFavorite: editingStation?.isFavorite ?? false,
            notes: editingStation?.notes ?? '',
            status: testResult?.ok
                ? 'online'
                : (editingStation?.status ?? 'online')
        });

        setIsFormOpen(false);
        await refreshAll();
    };

    return {
        isFormOpen,
        setIsFormOpen,
        editingStation,
        formName,
        setFormName,
        formUrl,
        setFormUrl,
        formLogo,
        setFormLogo,
        formGenre,
        setFormGenre,
        formCity,
        setFormCity,
        formCountry,
        setFormCountry,
        formGroup,
        setFormGroup,
        formType,
        setFormType,
        formTags,
        setFormTags,
        isTestingStream,
        testResult,
        openAddStationModal,
        openEditStationModal,
        handleTestStream,
        handleSaveStation
    };
}
