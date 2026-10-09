import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApiData } from "@/shared/hooks/useApiData";
import { getPatient, type Patient } from "@/shared/api/patients";
import { getScreeningResults, listScreenings, type ScreeningResults } from "@/shared/api/screenings";
import { getActiveScreeningId, setActiveScreeningId } from "./session";

export function useActiveScreening() {
  const [params] = useSearchParams();
  const fromQuery = params.get("sid");
  const stored = getActiveScreeningId();
  const { data: list } = useApiData(listScreenings, []);

  // Query → session → first screening in DB
  const screeningId = fromQuery || stored || list[0]?.screening_id || "";

  useEffect(() => {
    if (screeningId) setActiveScreeningId(screeningId);
  }, [screeningId]);

  const results = useApiData(
    () => (screeningId ? getScreeningResults(screeningId) : Promise.resolve(null)),
    null as ScreeningResults | null,
    [screeningId],
  );

  const patientId = results.data?.patient_id || "";
  const patient = useApiData(
    () => (patientId ? getPatient(patientId) : Promise.resolve(null)),
    null as Patient | null,
    [patientId],
  );

  return {
    screeningId,
    result: results.data,
    patient: patient.data,
    loading: Boolean(screeningId) && (results.loading || patient.loading),
    error: results.error || patient.error,
    reload: () => {
      results.reload();
      patient.reload();
    },
  };
}
