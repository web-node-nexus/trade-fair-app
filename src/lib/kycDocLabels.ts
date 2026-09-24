/** Human-readable labels for `kyc_documents.doc_type`. */
export function kycDocTypeLabel(docType: string): string {
  const map: Record<string, string> = {
    organizer_business_proof: "Business proof",
    organizer_gst: "GST certificate",
    organizer_pan: "PAN card",
    gst_certificate: "GST certificate",
    pan_card: "PAN card",
    aadhaar_card: "Aadhaar card",
    organizer_genuineness: "Proof of genuine organizer",
    exhibitor_id: "ID proof",
    provider_business_proof: "Business proof",
    provider_gst: "GST certificate",
  };
  return map[docType] ?? docType.replace(/_/g, " ");
}
