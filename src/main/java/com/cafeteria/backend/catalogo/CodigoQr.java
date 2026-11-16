package com.cafeteria.backend.catalogo;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageConfig;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Map;

/** Genera imágenes PNG de códigos QR con ZXing, en el color café de la marca. */
final class CodigoQr {
    private static final int CAFE = 0xFF1E1712;
    private static final int FONDO = 0xFFFFFFFF;

    private CodigoQr() {
    }

    static byte[] png(String texto, int tamano) {
        try {
            BitMatrix matriz = new QRCodeWriter().encode(texto, BarcodeFormat.QR_CODE, tamano, tamano,
                    Map.of(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M, EncodeHintType.MARGIN, 1));
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matriz, "PNG", salida, new MatrixToImageConfig(CAFE, FONDO));
            return salida.toByteArray();
        } catch (WriterException e) {
            throw new IllegalArgumentException("No se pudo generar el QR", e);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
