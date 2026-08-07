import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import {
  useRealtimeModule,
} from '../../../shared/hooks/useRealtimeModule';

import {
  getCompanyEvidences,
  getEvidenceSignedUrl,
  uploadCompanyEvidence,
} from './evidences.service';

import type {
  EvidenceFilters,
  EvidencesData,
} from './evidences.types';


const INITIAL_FILTERS:
EvidenceFilters = {
  search: '',

  operationId: '',

  assignmentId: '',

  status: '',

  aiStatus: '',
};


function normalize(
  value:
    string |
    undefined,
): string {
  return String(
    value ?? '',
  )
    .trim()
    .toLocaleLowerCase(
      'es',
    );
}


export function useEvidences() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  const assignmentFromUrl =
    searchParams.get(
      'assignment',
    ) ?? '';


  const [
    data,
    setData,
  ] =
    useState<EvidencesData | null>(
      null,
    );


  const [
    filters,
    setFilters,
  ] =
    useState<EvidenceFilters>({
      ...INITIAL_FILTERS,

      assignmentId:
        assignmentFromUrl,
    });


  const [
    selectedAssignmentId,
    setSelectedAssignmentId,
  ] =
    useState(
      assignmentFromUrl,
    );


  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    uploading,
    setUploading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState('');


  const [
    success,
    setSuccess,
  ] =
    useState('');


  /* =======================================================
     CARGAR
  ======================================================= */

  const loadEvidences =
    useCallback(
      async (
        background = false,
      ) => {
        try {
          if (background) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }


          setError('');


          const result =
            await getCompanyEvidences();


          setData(
            result,
          );


          if (
            assignmentFromUrl &&
            result.assignments.some(
              (assignment) =>
                assignment.id ===
                assignmentFromUrl,
            )
          ) {
            setSelectedAssignmentId(
              assignmentFromUrl,
            );
          }
        } catch (loadError) {
          console.error(
            '[Empresa Evidencias]',
            loadError,
          );


          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar las evidencias.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        assignmentFromUrl,
      ],
    );


  useEffect(() => {
    void loadEvidences();
  }, [loadEvidences]);


  /* =======================================================
     REALTIME
  ======================================================= */

  useRealtimeModule(
    'empresa-evidencias',
    [
      'evidence_documents',
      'obligation_assignments',
      'obligation_catalog',
      'mining_operations',
    ],
    () => {
      void loadEvidences(
        true,
      );
    },
  );


  /* =======================================================
     FILTROS
  ======================================================= */

  const filteredEvidences =
    useMemo(() => {
      if (!data) {
        return [];
      }


      const search =
        normalize(
          filters.search,
        );


      return data.evidences.filter(
        (evidence) => {
          if (search) {
            const searchable =
              normalize(
                [
                  evidence.fileName,
                  evidence.obligationCode,
                  evidence.obligationTitle,
                  evidence.operationName,
                ].join(' '),
              );


            if (
              !searchable.includes(
                search,
              )
            ) {
              return false;
            }
          }


          if (
            filters.operationId &&
            evidence.operationId !==
              filters.operationId
          ) {
            return false;
          }


          if (
            filters.assignmentId &&
            evidence.assignmentId !==
              filters.assignmentId
          ) {
            return false;
          }


          if (
            filters.status &&
            normalize(
              evidence.status,
            ) !==
              normalize(
                filters.status,
              )
          ) {
            return false;
          }


          if (
            filters.aiStatus &&
            normalize(
              evidence.aiStatus,
            ) !==
              normalize(
                filters.aiStatus,
              )
          ) {
            return false;
          }


          return true;
        },
      );
    }, [
      data,
      filters,
    ]);


  /* =======================================================
     UPLOAD
  ======================================================= */

  async function uploadEvidence() {
    if (
      !selectedAssignmentId
    ) {
      setError(
        'Selecciona una obligación.',
      );

      return;
    }


    if (!selectedFile) {
      setError(
        'Selecciona un archivo.',
      );

      return;
    }


    try {
      setUploading(
        true,
      );

      setError('');
      setSuccess('');


      await uploadCompanyEvidence({
        assignmentId:
          selectedAssignmentId,

        file:
          selectedFile,
      });


      setSelectedFile(
        null,
      );


      setSuccess(
        'Evidencia presentada correctamente.',
      );


      await loadEvidences(
        true,
      );
    } catch (uploadError) {
      console.error(
        '[Empresa Evidencias] Upload:',
        uploadError,
      );


      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'No se pudo presentar la evidencia.',
      );
    } finally {
      setUploading(
        false,
      );
    }
  }


  /* =======================================================
     ABRIR DOCUMENTO
  ======================================================= */

  async function openEvidence(
    storagePath: string,
  ) {
    try {
      setError('');


      const url =
        await getEvidenceSignedUrl(
          storagePath,
        );


      window.open(
        url,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (openError) {
      setError(
        openError instanceof Error
          ? openError.message
          : 'No se pudo abrir el documento.',
      );
    }
  }


  /* =======================================================
     FILTROS
  ======================================================= */

  function updateFilter<
    K extends
      keyof EvidenceFilters,
  >(
    field: K,

    value:
      EvidenceFilters[K],
  ) {
    setFilters(
      (current) => ({
        ...current,

        [field]:
          value,
      }),
    );


    if (
      field ===
      'assignmentId'
    ) {
      if (value) {
        setSearchParams({
          assignment:
            String(value),
        });
      } else {
        setSearchParams({});
      }
    }
  }


  function clearFilters() {
    setFilters({
      ...INITIAL_FILTERS,
    });

    setSearchParams({});
  }


  return {
    data,

    evidences:
      filteredEvidences,

    filters,

    selectedAssignmentId,
    selectedFile,

    loading,
    refreshing,
    uploading,

    error,
    success,

    setSelectedAssignmentId,
    setSelectedFile,

    loadEvidences,
    uploadEvidence,
    openEvidence,

    updateFilter,
    clearFilters,

    clearError: () =>
      setError(''),

    clearSuccess: () =>
      setSuccess(''),
  };
}