import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const QRFallback = ({ attendanceUrl }) => {
  const [copied, setCopied] = useState(false);

  const normalizedUrl = useMemo(() => attendanceUrl || "", [attendanceUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(normalizedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_error) {
      setCopied(false);
    }
  };

  return (
    <div className="qr-fallback">
      <h3>Continue attendance on phone</h3>
      <p>
        no camera found on this device. Scan this QR from your phone and open the same
        attendance page.
      </p>

      <div className="qr-card">
        <QRCodeCanvas value={normalizedUrl} size={190} includeMargin />
      </div>

      <a
        className="mobile-link"
        href={normalizedUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open attendance link
      </a>

      <button type="button" className="copy-link-btn" onClick={copyLink}>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
};

export default QRFallback;
