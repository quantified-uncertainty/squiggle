extern crate kernel_density;

use rand::Rng;
use rand::thread_rng;
// use kernel_density::kde;
// use crate::distribution::bandwidth::{nrd0, nrd};

// TODO: impl a constructor such that xs.len() == ys.len().
pub struct PdfCurve {
    xs: Vec<f64>,
    ys: Vec<f64>,
}

// pub fn samples_to_continuous_pdf(samples: Vec<f64>, bandwidth: f64) -> PdfCurve {
//     let pdf = kde::normal(&samples, bandwidth);
//     return PdfCurve {
//         xs: samples,
//         ys: samples.map(|x| pdf.density(x)),
//     };
// }

// pub fn getCurve(xs: Vec<f64>, n: u64) -> Vec<f64> {
//     let bandwidth = nrd(xs);
//     let curve = samples_to_continuous_pdf(samples, bandwidth);
//     return curve.ys;
// }


pub fn sampleN(xs: Vec<f32>, n: i32) -> Vec<f32> {
    let m = xs.len();
    let mut output = vec![];
    for _ in 0..n {
        output.push(xs[thread_rng().gen_range(0..m)])
    }
    return output;
}
