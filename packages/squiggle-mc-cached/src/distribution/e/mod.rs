pub mod a {
    pub mod floats {

        pub fn lenf(x: &Vec<f64>) -> f64 {
            return x.len() as f64;
        }

        pub fn percentile(x: &Vec<f64>, p: f64) -> f64 {
            let mut sortedx: Vec<f64> = Vec::new();
            for item in x {
                sortedx.push(*item)
            }
            sortedx.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let idx_float = p * (lenf(&sortedx) + 1.0);
            let idx = idx_float as usize;
            let frac = idx_float - (idx as f64);
            let p = if idx + 1 < sortedx.len() {
                sortedx[idx - 1] + frac * (sortedx[idx] - sortedx[idx - 1])
            } else {
                sortedx[idx - 1]
            };
            return p
        }

        pub fn min(x: Vec<f64>) -> f64 {
            return x.into_iter().min_by(|a, b| a.partial_cmp(b).unwrap()).unwrap()
        }
    }
}
