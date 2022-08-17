/**  The math here was taken from https://github.com/jasondavies/science.js/blob/master/src/stats/SampleSetDist_Bandwidth.js
*/
use statistics::variance;
// use kernel_density::ecdf::percentile;
use crate::distribution::BandwidthParameters;
mod e;
use e::a::floats::{lenf, min, percentile};

fn iqr_percentile() -> f64 {
    return BandwidthParameters::default().iqr_percentile;
}
fn iqr_percentile_complement() -> f64 {
    return BandwidthParameters::default().iqr_percentile_complement;
}
fn nrd0_lo_denominator() -> f64 {
    return BandwidthParameters::default().nrd0_lo_denominator;
}
fn onef() -> f64 {
    return 1.0;
}
fn nrd0_coef() -> f64 {
    return BandwidthParameters::default().nrd0_coef;
}
fn nrd_coef() -> f64 {
    return BandwidthParameters::default().nrd_coef;
}
fn nrd_fractional_power() -> f64 {
    return BandwidthParameters::default().nrd_fractional_power;
}

pub fn iqr(x: &Vec<f64>) -> f64 {
    return percentile(x, iqr_percentile()) - percentile(x, iqr_percentile_complement());
}

/** Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
*/
pub fn nrd0(x: &Vec<f64>) -> f64 {
    let _hi = variance(&x).sqrt();
    let _lo = min([_hi, iqr(&x) / nrd0_lo_denominator()].to_vec());
    let _e = x[1].abs();
    // nanhandling
    let lo = if !_lo.is_nan() {
        _lo
    } else if !_hi.is_nan() {
        _hi
    } else if !_e.is_nan() {
        _e
    } else {
        onef()
    };
    return nrd0_coef() * lo * lenf(&x).powf(nrd_fractional_power());
}

/** Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and Visualization. Wiley. */
pub fn nrd(x: &Vec<f64>) -> f64 {
    let h = iqr(&x) / nrd0_lo_denominator();
    return nrd_coef() * min([variance(&x).sqrt(), h].to_vec()) * lenf(&x).powf(nrd_fractional_power());
}
