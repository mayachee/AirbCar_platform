"""Unit tests for driving license image verification utility."""

import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image, ImageDraw

from core.utils.license_verification import verify_driving_license_images


def _make_test_image(width=900, height=560, text="DRIVING LICENCE", fmt="JPEG", color=(245, 245, 240)):
    image = Image.new("RGB", (width, height), color=color)
    draw = ImageDraw.Draw(image)
    draw.text((40, 40), text, fill=(20, 20, 20))
    draw.rectangle((20, 20, width - 20, height - 20), outline=(80, 80, 80), width=4)

    buf = io.BytesIO()
    image.save(buf, format=fmt)
    content = buf.getvalue()
    name = f"sample.{fmt.lower()}"
    content_type = "image/jpeg" if fmt.upper() == "JPEG" else "image/png"
    return SimpleUploadedFile(name, content, content_type=content_type)


def _make_noise_image(width=900, height=560, fmt="JPEG"):
    image = Image.effect_noise((width, height), 120).convert("RGB")
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    return SimpleUploadedFile("noise.jpg", buf.getvalue(), content_type="image/jpeg")


def _make_card_like_image(width=900, height=560, fmt="JPEG", accent=(40, 120, 200)):
    image = Image.new("RGB", (width, height), color=(238, 240, 236))
    draw = ImageDraw.Draw(image)
    draw.rectangle((20, 20, width - 20, height - 20), outline=(70, 70, 70), width=4)
    draw.rectangle((35, 35, width - 35, 110), fill=accent)
    draw.rectangle((45, 145, 230, 390), fill=(210, 210, 210), outline=(90, 90, 90), width=2)
    for y in range(160, 460, 26):
        draw.line((260, y, width - 60, y), fill=(120, 120, 120), width=2)
    draw.text((270, 150), "DRIVER LICENSE", fill=(15, 15, 15))

    buf = io.BytesIO()
    image.save(buf, format=fmt)
    return SimpleUploadedFile("card.jpg", buf.getvalue(), content_type="image/jpeg")


@pytest.mark.unit
class TestLicenseVerification:
    def test_verifies_front_and_back_with_ocr_signals(self):
        front = _make_test_image(text="DRIVING LICENCE NAME BIRTH ISSUED EXPIRY")
        back = _make_test_image(text="CATEGORIES CODES RESTRICTIONS A1 A2 B C1 D1")

        ocr_outputs = iter(
            [
                "driving licence name birth issued expiry",
                "categories codes restrictions a1 a2 b c1 d1",
            ]
        )

        result = verify_driving_license_images(
            front,
            back,
            ocr_extractor=lambda _img: next(ocr_outputs),
        )

        assert result["is_valid"] is True
        assert result["checks"]["front"]["side_hits"] > 0
        assert result["checks"]["back"]["side_hits"] > 0

    def test_rejects_identical_front_and_back(self):
        image = _make_test_image(text="DRIVING LICENCE TEST")

        ocr_outputs = iter(
            [
                "driving licence name birth issued expiry",
                "categories codes restrictions a1 b c1",
            ]
        )

        result = verify_driving_license_images(
            image,
            image,
            ocr_extractor=lambda _img: next(ocr_outputs),
        )

        assert result["is_valid"] is False
        assert any("identical" in err.lower() for err in result["errors"])

    def test_rejects_low_resolution_images(self):
        front = _make_test_image(width=300, height=180, text="front")
        back = _make_test_image(width=300, height=180, text="back")

        result = verify_driving_license_images(front, back)

        assert result["is_valid"] is False
        assert any("resolution" in err.lower() for err in result["errors"])

    def test_accepts_clean_pair_without_ocr(self):
        front = _make_card_like_image(accent=(35, 135, 210))
        back = _make_card_like_image(accent=(70, 165, 120))

        result = verify_driving_license_images(
            front,
            back,
            ocr_extractor=lambda _img: "",
        )

        assert result["is_valid"] is True
        assert result["score"] >= 0.60

    def test_rejects_noisy_non_license_even_with_some_ocr_terms(self):
        front = _make_noise_image()
        back = _make_noise_image()

        ocr_outputs = iter(
            [
                "driving license name",
                "categories codes a1",
            ]
        )

        result = verify_driving_license_images(
            front,
            back,
            ocr_extractor=lambda _img: next(ocr_outputs),
        )

        assert result["is_valid"] is False
