#include "trackback.h"
/* SYSR-PROP-009 / SWR-EDR-001: directional saturation, no Plant force conversion. */
Trackback_Request Trackback_EDrive(Trackback_Request request, const Trackback_Calibration* cal) {
    Trackback_Request result = {0, TB_NONE, request.validity};
    if (request.validity == TB_INVALID || request.magnitude == 0 || request.direction == TB_NONE) return result;
    double limit = request.direction == TB_FORWARD ? cal->forwardLimit : cal->reverseLimit;
    double torque = request.magnitude < limit ? request.magnitude : limit;
    result.magnitude = torque < 0 ? 0 : torque;
    result.direction = request.direction;
    return result;
}

/* Executable teaching defect and repair candidates. Normal contract stays above. */
Trackback_Request Trackback_EDriveCase(Trackback_Request request, const Trackback_Calibration* cal, int variant) {
    if (variant == 0 || request.validity == TB_INVALID || request.magnitude == 0 || request.direction == TB_NONE)
        return Trackback_EDrive(request, cal);
    if (variant == 2) request.magnitude *= 2;
    Trackback_Request result = variant == 3 ? request : Trackback_EDrive(request, cal);
    result.magnitude *= 0.5;
    return result;
}
