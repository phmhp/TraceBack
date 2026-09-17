#include "trackback.h"
/* SYSR-PROP-009 / SWR-VMC-001: consume vector speed magnitude, not signed velocity. */
Trackback_Request Trackback_VMC(Trackback_Request request, double speed, const Trackback_Calibration* cal) {
    Trackback_Request result = {0, TB_NONE, request.validity};
    if (request.validity == TB_INVALID || request.magnitude == 0 || request.direction == TB_NONE) return result;
    double maximum = request.direction == TB_FORWARD ? cal->forwardMapMaximum : cal->reverseMapMaximum;
    double zeroSpeed = request.direction == TB_FORWARD ? cal->forwardMapZeroSpeed : cal->reverseMapZeroSpeed;
    double factor = 1 - (speed < 0 ? 0 : speed) / zeroSpeed;
    if (factor < 0) factor = 0;
    double torque = request.magnitude * maximum * factor;
    result.magnitude = torque < 0 ? 0 : torque;
    result.direction = request.direction;
    return result;
}
