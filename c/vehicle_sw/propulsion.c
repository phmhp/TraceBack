#include "trackback.h"
/* SWR-PROP-001..004: validity precedes inhibit, then pedal saturation/direction. */
Trackback_Request Trackback_Propulsion(const Trackback_Input* in, const Trackback_Output* out) {
    Trackback_Request result = {0, TB_NONE, TB_VALID};
    if (in->acceleratorPedalValidity == TB_INVALID || out->gearStateValidity == TB_INVALID) {
        result.validity = TB_INVALID;
        return result;
    }
    if (!out->propulsionEnabled || out->gearState == TB_P || out->gearState == TB_N) return result;
    double pedal = in->acceleratorPedalPosition;
    /* Preserve the TS baseline's non-finite -> zero policy, including +/-Infinity. */
    if (!__builtin_isfinite(pedal)) pedal = 0;
    result.magnitude = pedal < 0 ? 0 : pedal > 1 ? 1 : pedal;
    if (result.magnitude > 0) result.direction = out->gearState == TB_D ? TB_FORWARD : TB_REVERSE;
    return result;
}
